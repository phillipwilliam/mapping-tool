import React from 'react';

const CategoryToolbar = ({numberOfCheckedAccounts, applyMappingCategory}) => {

    React.useEffect(() => {
        // const testTabbedSearch = new pwcTabbedMappingTreeControl(document.getElementById('mappingCategoryInput'), {'mappingTree': formattedMappingTemplate})
    }, []);

    return (
        <div className="categoryToolbar">
            <p>Select account(s) below and assign them to a PwC category.</p>

            <div className="mappingToolbar">
                <label htmlFor="mappingCategoryInput">
                    {
                        numberOfCheckedAccounts > 0
                            ? <span>Account(s) selected <span className="numberCircle">{numberOfCheckedAccounts}</span></span>
                            : <span>No account(s) selected</span>
                    }
                    <span className="sr-only">Please select a category to map to these.</span>
                </label>
                <input placeholder="Search or select PwC category" type="text" id="mappingCategoryInput" name="testTabbedSearch"/>
                <button onClick={applyMappingCategory} type="button" className="button">Map to category</button>

                <span className="statusMessage">
                    <i className="icon icon-appkit-circle_checkmark" role="presentation" tabIndex="-1" aria-hidden="true"></i>
                    All changes saved
                </span>
            </div>
        </div>
    );
};

export {
    CategoryToolbar
}