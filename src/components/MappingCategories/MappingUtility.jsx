import React from 'react';
import { CategoryToolbar } from './CategoryToolbar';
import { MappingTools } from './MappingTools';
import { MappingTable } from './MappingTable';

const MappingUtility = ({ accounts }) => {
    const toggleAllChecked = React.useRef(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [mappedAccountsHidden, setMappedAccountsVisibility] = React.useState(false);
    const [archivedAccountsHidden, setArchivedAccountsVisibility] = React.useState(false);
    const [checkedAccounts, setCheckedAccounts] = React.useState(accounts.reduce((list, account) => ({ ...list, [account.uid]: false }), {}));

    const accountContainsSearchTerm = ({ name, code, mainCategory, category: { label }}) => (
        !searchTerm ? true : [name, code, mainCategory, label].find(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const visibleAccounts = () => accounts.filter(account => 
        !(account.isMapped && mappedAccountsHidden) && !(account.isArchived && archivedAccountsHidden) && accountContainsSearchTerm(account)
    );

    return (
        <div>
            <CategoryToolbar
                applyMappingCategory={applyMappingCategory}
                numberOfCheckedAccounts={visibleAccounts().filter(account => checkedAccounts[account.uid] === true ).length}
            />
            <MappingTools
                searchTerm={searchTerm}
                archivedAccountsHidden={archivedAccountsHidden}
                mappedAccountsHidden={mappedAccountsHidden}
                applySearchTerm={searchString => setSearchTerm(searchString)}
                toggleMappedAccountsVisibility={() => setMappedAccountsVisibility(!mappedAccountsHidden)}
                toggleArchivedAccountsVisibility={() => setArchivedAccountsVisibility(!archivedAccountsHidden)}
            />
            <MappingTable
                accounts={visibleAccounts()}
                checkedAccounts={checkedAccounts}
                updateCheckedAccount={(uid) => { setCheckedAccounts({ ...checkedAccounts, [uid]: !checkedAccounts[uid] }) }}
                toggleAllAccounts={() => {
                    setCheckedAccounts(accounts.reduce((list, account) => ({ ...list, [account.uid]: !toggleAllChecked.current }), {}));
                    toggleAllChecked.current = !toggleAllChecked.current;
                }}
            />
        </div>
    )
}

export {
    MappingUtility
}