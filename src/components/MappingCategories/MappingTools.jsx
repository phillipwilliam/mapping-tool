import React from 'react';

const MappingTools = ({ searchTerm, archivedAccountsHidden, mappedAccountsHidden, toggleMappedAccountsVisibility, toggleArchivedAccountsVisibility, applySearchTerm }) => (
    <div className="tableTools">
        <div className="accountSearch">
            <i className="icon icon-appkit-search" role="presentation" tabIndex="-1" aria-hidden="true"></i>
            <label className="sr-only" htmlFor="accountSearchInput">
                Search by code, name, type or assigned category
            </label>
            <input onChange={e => applySearchTerm(e.target.value)} type="text" value={searchTerm} id="accountSearchInput" name="accountSearchInput" placeholder="Search by code, name, type or assigned category"/>
        </div>

        <div className="tableFilters">
            <label className="checkbox customCheckStyling simpleBorder">
                <input onChange={toggleArchivedAccountsVisibility} type="checkbox" defaultChecked={archivedAccountsHidden} name="hideArchived" id="hideArchived"/>
                <i className="checkstate icon icon-tick" role="presentation" tabIndex="-1" aria-hidden="true"></i>
                <span>Hide archived</span>
            </label>
            <label className="checkbox customCheckStyling simpleBorder">
                <input onChange={toggleMappedAccountsVisibility} type="checkbox" defaultChecked={mappedAccountsHidden} name="hideMapped" id="hideMapped"/>
                <i className="checkstate icon icon-tick" role="presentation" tabIndex="-1" aria-hidden="true"></i>
                <span>Hide mapped</span>
            </label>
        </div>
    </div>
);

export {
    MappingTools
}