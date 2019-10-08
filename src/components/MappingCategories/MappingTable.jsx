import React from 'react';

const MappingTableRow = ({ account, updateCheck, checked }) => (
    <tr>
        <th className="accountSelect">
            <label className="checkbox customCheckStyling simpleBorder">
                <input onChange={() => updateCheck(account.uid)} type="checkbox" name={`${account.uid}Check`} id={`${account.uid}Check`} checked={checked}/>
                <i className="checkstate icon icon-tick" role="presentation" tabIndex="-1" aria-hidden="true"></i>
                <span className="sr-only">Select account {account.code} {account.name}</span>
            </label>
        </th>

        <td className="accountCode">
            {account.code}
        </td>

        <td className="accountName">
            {account.name}
        </td>

        <td className="accountType">
            <span className={'accountTypePill ' + account.mainCategory}>{account.mainCategory}</span>
        </td>

        { account.isMapped ?
            <td className="accountMapping" title={account.category.label}>
                <span className={'accountTypePill ' + account.mainCategory}>{account.category.label}</span>
            </td>
            :
            <td className="accountMapping">
                <span>Unassigned</span>
            </td>
        }
    </tr>
);

const MappingTable = ({ accounts, checkedAccounts, updateCheckedAccount, toggleAllAccounts }) => {
    const sortOrder = React.useRef(['mainCategory', 'name', 'code', 'category.label']);

    const [sortSettings, setSortSettings] = React.useState({
        'code': 'desc',
        'name': 'desc',
        'mainCategory': 'desc',
        'category.label': 'desc'
    });

    const [sortedAccounts, sortAccounts] = React.useState(performSort());

    React.useEffect(() => {
        sortAccounts(performSort());
    }, [accounts]);

    function performSort () {
        return accounts.sort((a, b) => {
            let i = 0, result = 0, direction, account1Compare, account2Compare;
            while (i < sortOrder.current.length && result === 0) {
                direction = sortSettings[sortOrder.current[i]] === 'desc' ? 1 : -1;
                if(sortOrder.current[i] === 'category.label') {
                    account1Compare = a.category.label.toString().toLowerCase();
                    account2Compare = b.category.label.toString().toLowerCase();
                }else {
                    account1Compare = a[sortOrder.current[i]].toString().toLowerCase();
                    account2Compare = b[sortOrder.current[i]].toString().toLowerCase();
                }

                result = direction * (account1Compare < account2Compare ? -1 : (account1Compare > account2Compare ? 1 : 0));
                i++;
            }
            return result;
        });
    }

    const sortTable = (sortType) => {
        setSortSettings({
            ...sortSettings,
            [sortType]: sortSettings[sortType] === 'desc' ? 'asc' : 'desc'
        });

        //Change the sort order
        let currentPosition = sortOrder.current.indexOf(sortType);
        sortOrder.current.unshift(...sortOrder.current.splice(currentPosition, 1));

        sortAccounts(performSort());
    };

    return (
        <div className="categoryMappingTable">
            <table cellSpacing="0" cellPadding="0">
                <thead>
                <tr>
                    <th className="accountSelect">
                        <label className="checkbox customCheckStyling simpleBorder">
                            <input onChange={toggleAllAccounts} type="checkbox" name="selectAllAccounts" id="selectAllAccounts"/>
                            <i className="checkstate icon icon-tick" role="presentation" tabIndex="-1" aria-hidden="true"></i>
                            <span className="sr-only">Select all accounts</span>
                        </label>
                    </th>

                    <th className="accountCode">
                        <button onClick={() => sortTable('code')} type="button" className={'button sort sorted-' + sortSettings.code}>
                            <span>Code</span>
                        </button>
                    </th>

                    <th className="accountName">
                        <button onClick={() => sortTable('name')} type="button" className={'button sort sorted-' + sortSettings.name}>
                            <span>Account name</span>
                        </button>
                    </th>

                    <th className="accountType">
                        <button onClick={() => sortTable('mainCategory')} type="button" className={'button sort sorted-' + sortSettings.mainCategory}>
                            <span>Type</span>
                        </button>
                    </th>

                    <th className="accountMapping">
                        <button onClick={() => sortTable('category.label')} type="button" className={'button sort sorted-' + sortSettings['category.label']}>
                            <span>Assigned category</span>
                        </button>
                    </th>
                </tr>
                </thead>

                <tbody>
                {sortedAccounts.map(row => {
                    return <MappingTableRow key={row.uid} account={row} updateCheck={updateCheckedAccount} checked={checkedAccounts[row.uid]} />
                })}
                </tbody>
            </table>
        </div>
    )
};

export {
    MappingTable
}