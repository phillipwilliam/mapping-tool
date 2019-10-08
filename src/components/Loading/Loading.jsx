import React from 'react';

const Loading = () => (
    <div className="autoMap autoMapIntro autoMapProgress">
        <h4>Automapping in progress. Please wait...</h4>
        <p>Automap saves you time by automatically connecting your accounts to PwC categories or by suggesting categories that could be probable matches.</p>

        <div className="progress">
            <div className="dataSourceDetails">
                <i role="presentation" tabIndex="-1" className="dataSourceIcon xero"></i>
                <h5>Vanderlay Industries</h5>
            </div>
        </div>
    </div>
);

export {
    Loading
}