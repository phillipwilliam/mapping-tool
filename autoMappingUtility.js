function autoMapAccounts (accountList, mappingCategoryTree) {
    //Start by searching the known accounts list in autoMappingDefinition
    //If no match is found look for matches inside the flatMappingTemplate
    //QUESTIONS:
    // - How to handle multiple potential matches?
    // - Prompt to save?

    const excludeFromSearchTerms = ['and', 'for'];
    const keyRefineRegex = /[,\-\$\(\)\d\s]/gi;
    const searchRefineRegex = /[,\-\$\(\)\d]/gi;

    let matchSummary = [];
    let noMatches = [];

    function simpleKeyFilter (mappingObject, stringToFind, accountCategory) {
        const lowercaseStringToFind = stringToFind.toLowerCase().replace(searchRefineRegex, '');
        const pluralStringToFind = lowercaseStringToFind + 's';
        const singularStringToFind = lowercaseStringToFind.substring(0, lowercaseStringToFind.length - 1);
        const subCategories = mappingObject[accountCategory].subcategories ? mappingObject[accountCategory].subcategories : mappingObject[accountCategory];

        if (!mappingObject[accountCategory]) {
            console.log('Account category not supported ', accountCategory);
            return [];
        }

        return Object.keys(subCategories).filter(function (mappingKey) {
            const lowercaseMappingKey = mappingKey.toLowerCase().replace(searchRefineRegex, '');

            return lowercaseMappingKey.indexOf(lowercaseStringToFind) !== -1 || lowercaseMappingKey.indexOf(singularStringToFind) !== -1 || lowercaseMappingKey.indexOf(pluralStringToFind) !== -1;
        });
    }

    function complexKeyFilter (mappingObject, stringToFind, accountCategory) {
        //If no instant matches were found try splitting the stringToFind into pieces and search for matches
        const lowercaseStringToFind = stringToFind.toLowerCase().replace(searchRefineRegex, '');
        const searchPieces = lowercaseStringToFind.split(' ').filter(function (searchPiece) {
            return searchPiece.length > 2 && excludeFromSearchTerms.indexOf(searchPiece) === -1;
        });
        const subCategories = mappingObject[accountCategory].subcategories ? mappingObject[accountCategory].subcategories : mappingObject[accountCategory];

        if (!mappingObject[accountCategory]) {
            console.log('Account category not supported ', accountCategory);
            return;
        }

        const complexMatches = Object.keys(subCategories).filter(function (mappingKey) {
            const lowercaseMappingKey = mappingKey.toLowerCase().replace(searchRefineRegex, ''),
                mappingKeyPieces = lowercaseMappingKey.split(' ').filter(function (mappingKeyPiece) {
                    return mappingKeyPiece.length > 2 && excludeFromSearchTerms.indexOf(mappingKeyPiece) === -1;
                });

            //Return if any of the mappingKeyPieces contains any of the searchPieces
            return mappingKeyPieces.some(function (mappingKeyPiece) {
                return searchPieces.indexOf(mappingKeyPiece.replace(keyRefineRegex, '')) !== -1;
            })
        });

        if (complexMatches.length === 1) {
            return complexMatches;
        }

        return getHighestRatedMatches(complexMatches, searchPieces);
    }

    function getHighestRatedMatches (complexMatches, searchPieces) {
        //Run over the complexMatches and rate them to find the most likely match
        //In particular look for ones that match more than one of the search pieces
        //Consider plurals, &, ',', - and other symbols too
        let matchCount = 0;
        let highestMatchCount = 0;
        let highestRatingMatches = [];

        for (let complexMatch in complexMatches) {
            matchCount = 0;
            searchPieces.forEach(function (searchPiece) {
                const simpleSearchPiece = searchPiece.replace(keyRefineRegex, '');
                const isPlural = simpleSearchPiece.substring(simpleSearchPiece.length - 1) === 's';
                const complexMatchPiece = complexMatches[complexMatch].replace(searchRefineRegex, '');

                if (complexMatchPiece.indexOf(simpleSearchPiece) !== -1
                    || !isPlural && complexMatchPiece.indexOf(simpleSearchPiece + 's') !== -1
                    || isPlural && complexMatchPiece.indexOf(simpleSearchPiece.substring(0, simpleSearchPiece.length - 1)) !== -1
                ) {
                    matchCount++;
                }
            });

            if (matchCount === highestMatchCount) {
                if (highestRatingMatches[complexMatches[complexMatch]] === -1) {
                    //It has been matched already so bump the matchCount
                    matchCount++;
                } else {
                    highestRatingMatches.push(complexMatches[complexMatch]);
                }
            }

            if (matchCount > highestMatchCount) {
                highestRatingMatches = [complexMatches[complexMatch]];
                highestMatchCount = matchCount;
            }
        }

        return highestRatingMatches;
    }

    function findMostLikelyCategoryMatches (allMatches, accountDefinition, accountCategory, allOptions) {
        let accountName = accountDefinition.name.toLowerCase().trim(),
            isPlural = accountName.substring(accountName.length - 1) === 's',
            accountNamePieces = accountName.split(' '),
            category,
            uniqueCategories = {},
            highestRatingCategories = [],
            highestRatingCategoryLabels = [],
            categoryRating = 1,
            highestCategoryRating = 1,
            highestInnerRatingCategoryLabels = [],
            match,
            matchKey,
            directMatch = allOptions[accountName] || isPlural && allOptions[accountName.substring(0, accountName.length - 1)] || !isPlural && allOptions[accountName + 's'];

        if (!allMatches.length) {
            return [];
        }

        if (directMatch) {
            return [directMatch];
        }

        if (allMatches.length === 1) {
            return [allOptions[allMatches[0]]];
        }

        //Give a frequency rating to each category and use this rating to make a choice
        for (let matchIndex in allMatches) {
            matchKey = allMatches[matchIndex];
            match = allOptions[matchKey];
            category = match.label;

            if (category === accountName) {
                return [match];
            }

            if (!uniqueCategories[category]) {
                //Add to the highestRatingCategories if the current category rating is 1
                if (categoryRating === 1) {
                    highestRatingCategories.push(match);
                    highestRatingCategoryLabels.push(matchKey);
                }
                uniqueCategories[category] = 1;

            } else {
                categoryRating = uniqueCategories[category] + 1;

                if (categoryRating === highestCategoryRating) {
                    highestRatingCategories.push(match);
                    highestRatingCategoryLabels.push(matchKey);
                }

                if (categoryRating > highestCategoryRating) {
                    //Empty out the highestRatingCategories array to only include this category
                    highestRatingCategories = [match];
                    highestRatingCategoryLabels.push(matchKey);
                    highestCategoryRating = categoryRating;
                }

                uniqueCategories[category] = categoryRating;
            }
        }

        //If there is only 1 high rating category apply it straight away
        if (highestRatingCategories.length === 1) {
            return highestRatingCategories;
        } else {
            //Check for multiple word matches
            highestInnerRatingCategoryLabels = getHighestRatedMatches(highestRatingCategoryLabels, accountNamePieces);

            return Object.keys(allOptions).reduce(function (accumulator, categoryOption) {
                if (highestInnerRatingCategoryLabels.indexOf(categoryOption) !== -1) {
                    accumulator.push(allOptions[categoryOption]);
                }
                return accumulator;
            }, []);
        }
    }

    function matchingCategories (accountDefinition, accountName, useSimpleSearch) {
        const flatMappingTemplate = mappingCategoryTree.flatMappingTemplate;
        let accountCategory = mappingCategoryTree.standardiseMainCategory(accountDefinition.classification),
            autoMappingDefinitionMatches = useSimpleSearch ? simpleKeyFilter(autoMappingDefinitions, accountName, accountCategory) : complexKeyFilter(autoMappingDefinitions, accountName, accountCategory),
            flatMappingTemplateMatches = useSimpleSearch ? simpleKeyFilter(flatMappingTemplate, accountName, accountCategory) : complexKeyFilter(flatMappingTemplate, accountName, accountCategory),
            allMatches = autoMappingDefinitionMatches.concat(flatMappingTemplateMatches),
            allOptions = {},
            probabilityScore = 0,
            highestProbabilityScore = 0,
            highestProbabilityOptions = [];

        autoMappingDefinitionMatches.forEach(function (autoMappingDefinition) {
            allOptions[autoMappingDefinition] = autoMappingDefinitions[accountCategory][autoMappingDefinition];
        });

        flatMappingTemplateMatches.forEach(function (flatMappingTemplateMatch) {
            allOptions[flatMappingTemplateMatch] = flatMappingTemplate[accountCategory].subcategories[flatMappingTemplateMatch];
        });

        //Check the labels/uids of the options for high probability matches
        Object.keys(allOptions).forEach(function (allOptionKey) {
            const matchOption = allOptions[allOptionKey];

            if (!highestProbabilityOptions[matchOption.label]) {
                highestProbabilityOptions[matchOption.label] = matchOption;
                highestProbabilityOptions[matchOption.label].probability = 1;
            } else {
                highestProbabilityOptions[matchOption.label].probability++;
            }

            probabilityScore = highestProbabilityOptions[matchOption.label].probability;

            if (probabilityScore === highestProbabilityScore) {
                highestProbabilityOptions.push(highestProbabilityOptions[matchOption.label]);
            }

            if (probabilityScore > highestProbabilityScore) {
                highestProbabilityScore = probabilityScore;
                highestProbabilityOptions = [highestProbabilityOptions[matchOption.label]];
            }
        });

        return {
            'allMatches': allMatches,
            'allOptions': allOptions,
            'highestProbabilityOptions': highestProbabilityOptions
        };
    }

    function handleExactMatch (accountDefinition, accountCategory, matchedCategory) {
        matchSummary.push(accountDefinition.name + '~' + accountCategory.toUpperCase() + '~' + matchedCategory.label + '~ EXACT MATCH');
        accountDefinition.category = matchedCategory;
        accountDefinition.isMapped = true;
        accountDefinition.mainCategory = accountCategory;
    }

    function handleMultipleMatches (accountDefinition, accountCategory, matchedCategories) {
        const matchedCategoryLabels = matchedCategories.map(function (category) {
            return category.label
        });

        matchSummary.push(accountDefinition.name + '~' + accountCategory.toUpperCase() + '~' + matchedCategoryLabels.join(' || ') + '~ MULTIPLE MATCHES');
        accountDefinition.suggestedCategories = matchedCategories;
        accountDefinition.isMapped = false;
        accountDefinition.mainCategory = accountCategory;
    }

    function handleNoMatch (accountDefinition, accountCategory) {
        const noMatchCategory = autoMappingDefinitions[accountCategory]['NOMATCH'];
        matchSummary.push(accountDefinition.name + '~' + accountCategory.toUpperCase() + '~' + noMatchCategory.label + '~ NO-MATCH DEFAULT APPLIED');

        const noMatchMessage = accountCategory.toUpperCase() + ': "' + accountDefinition.name + '" did not match anything';
        noMatches.push(noMatchMessage);
        accountDefinition.suggestedCategories = [];
        accountDefinition.isMapped = false;
        accountDefinition.mainCategory = accountCategory;
    }

    function autoMapAccount (accountDefinition) {
        let accountCategory = mappingCategoryTree.standardiseMainCategory(accountDefinition.classification),
            accountName = accountDefinition.name.toLowerCase().trim(),
            simpleMatches,
            mostLikelySimpleMatches,
            mostLikelyComplexMatches,
            complexMatches;

        if (autoMappingDefinitions[accountCategory][accountName]) {
            return handleExactMatch(accountDefinition, accountCategory, autoMappingDefinitions[accountCategory][accountName]);
        }

        simpleMatches = matchingCategories(accountDefinition, accountName, true);

        if (simpleMatches.allMatches.length === 1) {
            return handleExactMatch(accountDefinition, accountCategory, simpleMatches.allOptions[simpleMatches.allMatches[0]]);
        } else {
            mostLikelySimpleMatches = findMostLikelyCategoryMatches(simpleMatches.allMatches, accountDefinition, accountCategory, simpleMatches.allOptions);

            //If there are too many simple matches try running a complex match instead
            if (mostLikelySimpleMatches.length === 1) {
                return handleExactMatch(accountDefinition, accountCategory, mostLikelySimpleMatches[0]);
            } else {
                //Start looking for more complex matches
                //Either didn't find any or it found a few matches
                complexMatches = matchingCategories(accountDefinition, accountName, false);

                if (!mostLikelySimpleMatches.length) {
                    if (!complexMatches.allMatches.length) {
                        return handleNoMatch(accountDefinition, accountCategory);
                    } else if (complexMatches.highestProbabilityOptions.length === 1) {
                        return handleExactMatch(accountDefinition, accountCategory, complexMatches.highestProbabilityOptions[0]);
                    } else {
                        mostLikelyComplexMatches = findMostLikelyCategoryMatches(complexMatches.allMatches, accountDefinition, accountCategory, complexMatches.allOptions);

                        if (mostLikelyComplexMatches.length === 0) {
                            return handleNoMatch(accountDefinition, accountCategory);
                        } else if (mostLikelyComplexMatches.length === 1) {
                            return handleExactMatch(accountDefinition, accountCategory, mostLikelyComplexMatches[0]);
                        } else {
                            return handleMultipleMatches(accountDefinition, accountCategory, mostLikelyComplexMatches)
                        }
                    }
                } else {
                    //TODO: Consider using both sets of matches???
                    //Look for occurrences of the same category label?
                    mostLikelyComplexMatches = findMostLikelyCategoryMatches(complexMatches.allMatches, accountDefinition, accountCategory, complexMatches.allOptions);

                    if (mostLikelyComplexMatches.length === 1) {
                        return handleExactMatch(accountDefinition, accountCategory, mostLikelyComplexMatches[0]);
                    } else {
                        return handleMultipleMatches(accountDefinition, accountCategory, mostLikelyComplexMatches)
                    }
                }
            }
        }
    }

    return new Promise(function(resolve) {
        for (var a = 0; a < accountList.length; a++) {
            autoMapAccount(accountList[a]);
        }
        resolve({
            matchSummary: matchSummary,
            noMatches: noMatches,
            accounts: accountList
        });
    });
}
