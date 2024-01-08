// Library data shared by multiple media types

// 'all' slugs refer to all assets for a library owner (uploads and stock)
// 'stock' filters for assets with a type `stock`
// 'uploads' filters for assets with a type `userUpload`
export const mediaLibrarySlugs = {
    accountAll: 'accountAll',
    accountStock: 'accountStock',
    accountUploads: 'accountUploads',
    businessAll: 'businessAll',
    businessSearchResults: 'businessSearchResults',
    businessStock: 'businessStock',
    businessUploads: 'businessUploads',
    static: 'static',
};

export const assetOwnerTypes = {
    account: 'account',
    business: 'business',
};

export const assetTypes = {
    searchResult: 'searchResult',
    static: 'static',
    stock: 'stock',
    userUpload: 'userUpload',
};

export const mediaTypes = {
    image: 'image',
    footage: 'footage',
};