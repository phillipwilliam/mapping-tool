function MappingCategoryTree () {

    let flatMappingTemplate = {};
    let uidKeyedMappingTree = {};
    let leafPaths = {};

    function MappingTree (args) {
        this.mappingTree = args.mappingTree;
        this.flatMappingTemplate = flatMappingTemplate;
        this.uidKeyedMappingTree = uidKeyedMappingTree;
        this.getSimpleBranchStructure = getSimpleBranchStructure;
        this.leafPaths = leafPaths;
        this.standardiseMainCategory = standardiseMainCategory;
    }

    MappingTree.create = function create (args) {
        return new MappingTree(args);
    };

    //Format the mapping template into a better structure
    function formatSubCategories (subCategories, mainCategory, parentUid, parentStructure) {
        return subCategories.map(function (subCategory) {
            const subCategoryDefinition = {
                label: subCategory.name.toLowerCase(),
                uid: subCategory.data.uid
            };

            const leafPath = parentUid + ',' + subCategory.data.uid;
            leafPaths[subCategory.data.uid] = leafPath;

            flatMappingTemplate[mainCategory].subcategories[subCategory.name.toLowerCase()] = {
                label: subCategory.name.toLowerCase(),
                uid: subCategory.data.uid
            };

            parentStructure[subCategory.data.uid] = subCategoryDefinition;

            if (subCategory.children && subCategory.children.length) {
                subCategoryDefinition.subcategories = formatSubCategories(subCategory.children, mainCategory, leafPath, parentStructure[subCategory.data.uid]);
            }
            return subCategoryDefinition;
        });
    };

    function standardiseMainCategory (categoryLabel) {
        switch (categoryLabel.toLowerCase()) {
            case 'asset':
            case 'a':
                return 'assets';
            case 'expense':
            case 'x':
                return 'expenses';
            case 'liability':
            case 'liabilities':
            case 'l':
                return 'liabilities';
            case 'income':
            case 'r':
                return 'revenue';
            case 'holdings':
            case 'capital':
            case 'e':
                return 'equity';
            default:
                return categoryLabel.toLowerCase();
        }
    }

    MappingTree.prototype.standardiseMainCategory = standardiseMainCategory;

    //Main categories sit directly under tags.
    MappingTree.prototype.formatMainCategory = function formatMainCategory () {
        return this.mappingTree.map(function (mainBranch) {
            const mainCategory = standardiseMainCategory(mainBranch.name),
                mainCategoryDefinition = {
                    label: mainBranch.name,
                    uid: mainBranch.data.uid,
                    subcategories: {}
                };

            leafPaths[mainBranch.data.uid] = mainBranch.data.uid;

            flatMappingTemplate[mainCategory] = mainCategoryDefinition;

            uidKeyedMappingTree[mainBranch.data.uid] = {
                label: mainBranch.name,
                uid: mainBranch.data.uid
            };

            return {...mainCategoryDefinition, subcategories: formatSubCategories(mainBranch.children, mainCategory, mainBranch.data.uid, uidKeyedMappingTree[mainBranch.data.uid])};
        });
    };

    function getSimpleBranchStructure (uid) {
        const leafPath = leafPaths[uid];
        const pathPieces = leafPath ? leafPath.split(',') : [];

        let branchStructure = {};
        let currentNode;
        let currentBranchPosition;
        let currentBranchUid;

        if (pathPieces.length > 1) {
            for(let b = 0; b < pathPieces.length; b++) {
                currentBranchUid = pathPieces[b];
                if(b === 0) {
                    currentNode = uidKeyedMappingTree[currentBranchUid];

                    branchStructure.branch = {
                        "label": currentNode.label,
                        "uid": currentNode.uid
                    };

                    currentBranchPosition = branchStructure.branch;
                } else {
                    currentNode = currentNode[currentBranchUid];

                    currentBranchPosition.branch = {
                        "label": currentNode.label,
                        "uid": currentNode.uid
                    };

                    currentBranchPosition = currentBranchPosition.branch;
                }
            }
        }

        else {
            //An incorrect uid was passed
            console.log('Incorrect UID passed or UID not found');
        }

        return branchStructure;
    }

    return MappingTree;
}
