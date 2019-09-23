// Mimicks some of the behaviour of https://www.w3.org/TR/wai-aria-practices/examples/combobox/aria1.1pattern/listbox-combo.html
// Presents options in a tree structure with tabs across the top.
// Text input is used to filter the tree

var pwcTabbedMappingTreeControl = function (textInput, settings) {
    var ctrl = this,
        inputId = textInput.id,
        associatedLabel = document.querySelectorAll('[for="' + inputId + '"]'),
        labelId = associatedLabel.id || inputId + '_label',
        wrapperId = inputId + '_wrapper',
        wrapperCssClass = 'mappingTreeWrapper',
        resultsContainerId = inputId + '_results';

    // Prevent settings property checks causing errors
    if (!settings) {
        settings = {};
    }

    if (settings.wrapperCssClass) {
        wrapperCssClass += ' ' + settings.wrapperCssClass;
    }

    ctrl.wrapper;
    ctrl.resultsContainer;
    ctrl.activeResultIndex = -1;
    ctrl.resultsShowing = false;
    ctrl.resultsCount = 0;

    ctrl.mappingTree = settings.mappingTree;

    function buildMappingTree () {
        var treeMarkup = [],
            branchClass,
            b;

        function buildBranch (branch, level, path, catClass) {
            var c,
                isBranch = branch.subcategories && branch.subcategories.length;

            branchClass = (level === 0 ? 'tab' : 'level_' + level) + ' ' + catClass;

            if (isBranch) {
                branchClass += ' accordion';
            } else {
                branchClass += ' leaf';
            }

            treeMarkup.push('<li class="' + branchClass + '"><span data-label="' + branch.label + '" data-category="' + catClass + '" id="' + branch.uid + '" data-path="' + path + '" class="treeItem ' + (isBranch ? 'branchItem' : 'leafItem') + '">' + branch.label + '</span>');

            if (isBranch) {
                treeMarkup.push('<ul id="' + branch.uid + '_children" class="mappingTree branch level_' + level + '">');

                for (c = 0; c < branch.subcategories.length; c++) {
                    buildBranch(branch.subcategories[c], level + 1, path + "," + c, catClass);
                }

                treeMarkup.push('</ul>');
            }

            treeMarkup.push('</li>');
        }

        for (b = 0; b < ctrl.mappingTree.length; b++) {
            buildBranch(ctrl.mappingTree[b], 0, b, ctrl.mappingTree[b].label.toLowerCase());
        }

        return treeMarkup.join('');
    }

    function initialiseControls () {
        ctrl.wrapper = document.createElement('div');
        ctrl.wrapper.className = wrapperCssClass;
        ctrl.wrapper.id = wrapperId;

        ctrl.resultsContainer = document.createElement('ul');
        ctrl.resultsContainer.className = 'tabbedMappingTreeResults ' + (settings.containerCssClass ? settings.containerCssClass : '');
        ctrl.resultsContainer.id = resultsContainerId;

        textInput.parentNode.insertBefore(ctrl.wrapper, textInput);
        ctrl.wrapper.appendChild(textInput);
        ctrl.wrapper.appendChild(ctrl.resultsContainer);
        ctrl.initialised = true;

        //Add aria tags to the wrapper, text input and list
        textInput.setAttribute('aria-autocomplete', 'list');
        textInput.setAttribute('aria-controls', resultsContainerId);
        textInput.setAttribute('aria-activedescendant', ''); //This will change dynamically with the arrow keys to point to a results list item

        ctrl.resultsContainer.setAttribute('aria-labelledby', labelId);
        ctrl.resultsContainer.setAttribute('role', 'listbox');

        ctrl.wrapper.setAttribute('aria-expanded', 'false');
        ctrl.wrapper.setAttribute('aria-owns', resultsContainerId);
        ctrl.wrapper.setAttribute('aria-haspopup', 'listbox');

        ctrl.resultsContainer.innerHTML = buildMappingTree();
    }

    // Give the input a wrapper and resultsContainer if required.
    // This will be required for styling and positioning the list and aria accessibility tags.
    if (!ctrl.initialised) {
        initialiseControls();
    } else {
        ctrl.wrapper = textInput.parentNode;
        ctrl.resultsContainer = ctrl.wrapper.getElementsByClassName('autoCompleteResults');
    }

    // Setup event handlers
    ctrl.handleKeyUpTextInput = handleKeyUpTextInput;
    ctrl.handleKeyDownTextInput = handleKeyDownTextInput;
    ctrl.handleFocusTextInput = handleFocusTextInput;
    ctrl.handleBlurTextInput = handleBlurTextInput;
    ctrl.selectMapItem = selectMapItem;
    ctrl.handleOverList = handleOverList;
    ctrl.handleOffList = handleOffList;

    // Hook up events
    textInput.addEventListener('keyup', ctrl.handleKeyUpTextInput);
    textInput.addEventListener('keydown', ctrl.handleKeyDownTextInput);
    textInput.addEventListener('focus', ctrl.handleFocusTextInput);
    textInput.addEventListener('blur', ctrl.handleBlurTextInput);

    ctrl.resultsContainer.addEventListener('click', ctrl.selectMapItem); //This is the only time the result item receives an interaction state.

    ['mouseenter', 'touchstart'].forEach(function(eventName) {
        ctrl.resultsContainer.addEventListener(eventName, ctrl.handleOverList);
    });

    ['mouseleave', 'touchend'].forEach(function (eventName) {
        ctrl.resultsContainer.addEventListener(eventName, ctrl.handleOffList);
    });

    // Open/closed display states
    ctrl.hideResultsList = hideResultsList;
    ctrl.updateResultsList = updateResultsList;
    ctrl.listActive = false;

    function handleOverList () {
        ctrl.listActive = true;
    }

    function handleOffList () {
        ctrl.listActive = false;
    }

    function hideResultsList (forceClose) {
        if (!ctrl.listActive || forceClose) {
            ctrl.resultsShowing = false;
            ctrl.activeResultIndex = -1;
            ctrl.wrapper.className = wrapperCssClass; //Reset to remove the open class

            // Reset aria attributes
            ctrl.wrapper.setAttribute('aria-expanded', 'false');
            textInput.setAttribute('aria-activedescendant', '');

            if (typeof settings.onHideResultsList === 'function') {
                settings.onHideResultsList();
            }
        }
    }

    function showResultsList () {
        // Set the open display and aria state on the wrapper
        ctrl.wrapper.className = wrapperCssClass + ' open';
        ctrl.wrapper.setAttribute('aria-expanded', 'true');

        ctrl.resultsShowing = false;
        ctrl.activeResultIndex = -1;

        if (typeof settings.onShowResultsList === 'function') {
            settings.onShowResultsList();
        }
    }

    // Triggered when they keydown a non-control key in the textInput
    function updateResultsList () {
        // Search through the mapping tree and find anything that matches
        // Add an active class to all matches and their parent nodes

        var searchString = textInput.value.toLowerCase(),
            lowerCaseLabel;


        ctrl.resultsContainer.querySelectorAll('.hide').forEach(function (item) {
            item.classList.remove('hide');
        });

        ctrl.resultsContainer.querySelectorAll('.activeChild').forEach(function (item) {
            item.classList.remove('activeChild');
        });

        if (searchString === '') {
            //Remove the active class from everything
            ctrl.resultsContainer.querySelectorAll('.active').forEach(function (item) {
                item.classList.remove('active');
            });
        } else {
            ctrl.resultsContainer.querySelectorAll('.leafItem').forEach(function (item) {
                lowerCaseLabel = item.dataset.label.toLowerCase();

                setItemState(item, lowerCaseLabel.indexOf(searchString) !== -1, false);
            });
        }
    }

    function getParentNodes (item) {
        // Use the path data property to find the parents
        var path = item.dataset.path,
            pathPieces = path.split(','),
            parentNode,
            parentBranch = '',
            parentNodes = pathPieces.reduce(function (nodes, pathPiece) {
                if (parentBranch === '') {
                    parentBranch = ctrl.mappingTree[pathPiece];
                } else {
                    parentBranch = parentBranch.subcategories[pathPiece];
                }

                parentNode = document.getElementById(parentBranch.uid);

                nodes.push(parentNode);
                return nodes;
            }, []);

        return parentNodes;
    }

    function handleKeyUpTextInput (event) {
        var key = event.which || event.keyCode;

        switch (key) {
            case 37: // Arrows, Esc and Enter
            case 38:
            case 39:
            case 40:
            case 27:
            case 13:
                event.preventDefault();
                return;
            default:
                ctrl.updateResultsList(false);
                break;
        }
    }

    function handleKeyDownTextInput (event) {
        var key = event.which || event.keyCode,
            allResults = Array.prototype.slice.call(ctrl.resultsContainer.querySelectorAll('.treeItem:not(.hide)')),
            resultsCount = allResults.length,
            selectedTreeItem = ctrl.resultsContainer.querySelectorAll('.treeItem.selected')[0],
            selectedResultIndex = selectedTreeItem ? allResults.indexOf(selectedTreeItem) : -1,
            activeIndex = selectedResultIndex,
            newActiveListItem;

        //Esc key - closes the list and clears the input value
        if (key === 27) {
            ctrl.hideResultsList(true);
            setTimeout(function () {
                textInput.value = '';
            }, 1);
            return;
        }

        // If there are no results don't do anything yet
        if (!allResults.length) {
            return;
        }

        switch (key) {
            case 37: // Left arrow
            case 38: // Up arrow
                // You are moving forwards
                // If you are at the top of the list or there isn't an active index go to the last item
                if (selectedResultIndex <= 0) {
                    activeIndex = resultsCount - 1;
                }

                // If you are within the list make the previous item active
                else {
                    activeIndex--;
                }
                break;
            case 39: // Right arrow
            case 40: // Down arrow
                // You are moving backwards
                // If you are at the last item of the list or there is no active index make the first item active
                if (activeIndex === -1 || activeIndex >= resultsCount - 1) {
                    activeIndex = 0;
                }

                // If you are within the list make the next item active
                else {
                    activeIndex++;
                }
                break;
            case 13: // Enter key
                // This should select and apply the active item if there is one
                if (!activeIndex) {
                    return;
                }
                newActiveListItem = allResults[activeIndex];
                ctrl.selectMapItem(event, true, newActiveListItem);
                return;
            case 9: // Tab
                // This should select the active item if there is one and then close the results list.
                ctrl.handleBlurTextInput(event);
                ctrl.hideResultsList();
                return;
            default:
                return;
        }

        event.preventDefault();

        selectMapItem(event, true, allResults[activeIndex]);
    }

    function handleFocusTextInput () {
        showResultsList();
    }

    function handleBlurTextInput () {
        hideResultsList();
    }

    var currentActiveCategory = '',
        currentActiveMappingUID = '';

    function selectMapItem (event, keyEvent, keyTarget) {
        var activeListItem = keyEvent ? keyTarget : event.target,
            activeCategory = activeListItem.dataset.category,
            selectedItem = ctrl.resultsContainer.getElementsByClassName('selected'),
            turnOffActive = activeListItem.classList.contains('active') && textInput.value === activeListItem.innerText;

        if(selectedItem && selectedItem.length) {
            selectedItem[0].classList.remove('selected');
        }

        if (currentActiveCategory !== activeCategory) {
            ctrl.resultsContainer.getElementsByClassName('tab ' + currentActiveCategory)[0].classList.remove('active');
            ctrl.resultsContainer.getElementsByClassName('tab ' + activeCategory)[0].classList.add('active');
            currentActiveCategory = activeCategory;
        }

        setItemState(activeListItem, !turnOffActive, true);
    }

    function setItemState (item, active, isSelectionEvent) {
        var itemParent = item.parentElement;

        if (active) {
            //This is a match
            item.classList.add('active');

            if(isSelectionEvent) {
                item.classList.add('selected');
                item.setAttribute('aria-selected', 'true');
                textInput.setAttribute('aria-activedescendant', item.id);
                textInput.value = item.dataset.label;
                currentActiveMappingUID = item.id;
                textInput.setAttribute('data-category', JSON.stringify({
                    'uid': currentActiveMappingUID,
                    'label': textInput.value
                }));
            }

            itemParent.classList.remove('hide');

            // Add active class to all parent nodes
            getParentNodes(item).forEach(function (pNode) {
                pNode.classList.add('active');
                pNode.parentElement.classList.add('activeChild');
                pNode.parentElement.classList.remove('hide');
            });
        } else {
            item.classList.remove('active', 'selected');

            if (isSelectionEvent) {
                item.setAttribute('aria-selected', 'false');
                textInput.setAttribute('aria-activedescendant', '');
                textInput.value = '';
                currentActiveMappingUID = '';

                textInput.removeAttribute('data-category');
            } else {
                item.parentElement.classList.add('hide');
            }

            // Remove active class from all parent nodes unless another child is active
            getParentNodes(item).forEach(function (pNode) {
                if (!pNode.parentElement.classList.contains('activeChild')) {
                    pNode.parentElement.classList.add('hide');
                    pNode.classList.remove('active');
                }
            });
        }
        textInput.focus();
    }

};
