var pwcAutocompleteControl = function (textInput, settings) {
    var ctrl = this,
        inputId = textInput.id,
        associatedLabel = document.querySelectorAll('[for="' + inputId + '"]'),
        labelId = associatedLabel.id || inputId + '_label',
        wrapperId = inputId + '_wrapper',
        wrapperCssClass = 'autoCompleteWrapper',
        resultsContainerId = inputId + '_results';

    // Prevent settings property checks causing errors
    if (!settings) {
        settings = {};
    }

    ctrl.wrapper;
    ctrl.resultsContainer;
    ctrl.activeResultIndex = -1;
    ctrl.resultsShowing = false;
    ctrl.resultsCount = 0;

    function initialiseControls () {
        ctrl.wrapper = document.createElement('div');
        ctrl.wrapper.className = wrapperCssClass;
        ctrl.wrapper.id = wrapperId;

        ctrl.resultsContainer = document.createElement('ul');
        ctrl.resultsContainer.className = 'autoCompleteResults';
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
    ctrl.selectResultItem = selectResultItem;

    // Hook up events
    textInput.addEventListener('keyup', ctrl.handleKeyUpTextInput);
    textInput.addEventListener('keydown', ctrl.handleKeyDownTextInput);
    textInput.addEventListener('focus', ctrl.handleFocusTextInput);
    textInput.addEventListener('blur', ctrl.handleBlurTextInput);

    ctrl.resultsContainer.addEventListener('click', ctrl.selectResultItem); //This is the only time the result item receives an interaction state.

    // Open/closed display states
    ctrl.hideResultsList = hideResultsList;
    ctrl.updateResultsList = updateResultsList;
    ctrl.fetchResults = fetchResults;

    function fetchResults () {
        // If a predefined list of options is passed use them but with filtering applied.
        if (settings.options) {
            return settings.options.filter(function (option) {
                return option.indexOf(textInput.value) !== -1;
            });
        }

        if (settings.onFetchResults) {
            return settings.onFetchResults();
        }

        if (settings.onFetchResultsPromise) {
            return settings.onFetchResultsPromise().then(function (response) {
                return response;
            });
        } else {
            return [];
        }
    }

    // If it is just blurred leave the results so they can be re-displayed on focus
    function hideResultsList (leaveResults) {
        if (!leaveResults) {
            ctrl.resultsCount = 0;
            ctrl.resultsContainer.innerHTML = '';
        }

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

    function showResultsList () {
        if (ctrl.resultsCount) {
            // Set the open display and aria state on the wrapper
            ctrl.wrapper.className = wrapperCssClass + ' open';
            ctrl.wrapper.setAttribute('aria-expanded', 'true');

            ctrl.resultsShowing = false;
            ctrl.activeResultIndex = -1;

            if (typeof settings.onShowResultsList === 'function') {
                settings.onShowResultsList();
            }
        }
    }

    // Triggered when they keydown a non-control key in the textInput
    function updateResultsList () {
        var results,
            resultsListItem;

        ctrl.hideResultsList(); // Hide the list while the new results are compiled.

        if (!textInput.value) {
            results = [];
        } else {
            results = ctrl.fetchResults()
        }

        // TODO: Consider sorting the list. Other option is to assume the list comes pre-sorted
        if (results.length) {
            results.forEach(function (result, index) {
                resultsListItem = document.createElement('li');

                resultsListItem.className = 'result';
                resultsListItem.innerText = result;
                resultsListItem.setAttribute('role', 'option');
                resultsListItem.setAttribute('activeIndex', index);
                resultsListItem.id = 'resultsListItem' + index;

                // Auto select the first item in the results list
                if (index === 0) {
                    resultsListItem.setAttribute('aria-selected', 'true');
                    resultsListItem.classList.add('focused');
                    ctrl.activeResultIndex = 0;
                }
                ctrl.resultsContainer.appendChild(resultsListItem);
            });

            ctrl.resultsCount = results.length;
            showResultsList();
        }
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
            activeIndex = ctrl.activeResultIndex,
            newActiveListItem;

        //Esc key - closes the list and clears the input value
        if (key === 27) {
            ctrl.hideResultsList();
            setTimeout(function () {
                textInput.value = '';
            }, 1);
            return;
        }

        // If there are no results don't do anything yet
        if (ctrl.resultsCount < 1) {
            return;
        }

        switch (key) {
            case 37: // Left arrow
            case 38: // Up arrow
                // You are moving forwards
                // If you are at the top of the list or there isn't an active index go to the last item
                if (activeIndex <= 0) {
                    activeIndex = ctrl.resultsCount - 1;
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
                if (activeIndex === -1 || activeIndex >= ctrl.resultsCount - 1) {
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
                newActiveListItem = ctrl.resultsContainer.children[activeIndex];
                ctrl.selectResultItem(event, activeIndex, true);
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

        resetCurrentActiveListItem();
        ctrl.selectResultItem(event, activeIndex, true);
    }

    function handleFocusTextInput () {
        showResultsList();
    }

    function handleBlurTextInput () {
        hideResultsList(true);
    }

    function selectResultItem (event, activeIndex, keyEvent) {
        if (!keyEvent) {
            activeIndex = event.targetElement.getAttribute('activeIndex');
        }

        var newActiveListItem = ctrl.resultsContainer.children[activeIndex];

        ctrl.activeResultIndex = activeIndex;

        if (newActiveListItem) {
            textInput.setAttribute('aria-activedescendant', 'resultsListItem' + activeIndex);
            newActiveListItem.classList.add('active');
            newActiveListItem.setAttribute('aria-selected', 'true');
        } else {
            textInput.setAttribute('aria-activedescendant', '');
        }
    }

    // Utility functions
    function resetCurrentActiveListItem () {
        var curActiveListItem = ctrl.resultsContainer.children[ctrl.activeResultIndex];
        if (curActiveListItem) {
            curActiveListItem.classList.remove('active');
            curActiveListItem.setAttribute('aria-selected', 'false');
        }
    }
};
