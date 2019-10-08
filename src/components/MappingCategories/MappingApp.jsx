import React from 'react';
import { MappingUtility } from './MappingUtility'
import { Loading } from '../Loading/Loading';
import { autoMapAccounts } from '../../../autoMappingUtility';

const MappingApp = ({ orgDetails }) => {
    const [mappedAccounts, setMappedAccounts] = React.useState(null);
    const [isMapped, setMappedState] = React.useState(false);

    React.useEffect(() => {
        autoMapAccounts(orgDetails.accounts, mappingCategoryTree).then(autoMapResults => {
            setMappedAccounts(autoMapResults.accounts);
            setMappedState(true);
        });
    }, []);

    return isMapped ? <MappingUtility accounts={mappedAccounts} /> : <Loading />;
};

export {
    MappingApp
}