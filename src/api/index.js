import { getApiF, postApiF, path } from './utils'
import { /*CONTRACTS_LIST_ID,*/TEMPLATE_LIST_ID } from '../constants'

export const getEntityTypeName = listId => getApiF(
    `/_api/lists(guid'${listId}')/listItemEntityTypeFullName`
).chain(path(r => r.ListItemEntityTypeFullName))

export const getFieldsList = (listId, itemId, contentTypeId) => postApiF(
    '/_Layouts/15/BaseSolution/Services.aspx/GetFieldsList',
    { listId, itemId, formType: 'New', contentTypeId }
)

export const getListData = listId => getApiF(
    `/_api/web/lists(guid'${listId}')`
)

export const addItem = (listId, item) => postApiF(
    `/_api/web/lists(guid'${listId}')/items`,
    item
)

export const saveFieldItems = (guid, fields, addFiles) => postApiF(
    '/_Layouts/15/BaseSolution/Services.aspx/SaveFieldItems',
    { guid, fields, deletedItems: [], addFiles, deleteFiles: [] } // default deletedItems of empty array
)

export const getItems = listId => getApiF(
    `/_api/web/lists(guid'${listId}')/items?$filter=FSObjType eq 0&$top=999999`
).chain(path(r => r.results))

export const getFilteredItems = (listId, query) => getApiF(
    `/_api/web/lists(guid'${listId}')/items?$filter=${query}& FSObjType eq 0${query.includes('top') ? '' : '&$top=999999'}`
).chain(path(r => r.results))

export const getItemById = (listId, itemId) => getApiF(
    `/_api/web/lists(guid'${listId}')/items?$select=Id eq ${itemId}`
).chain(path(r => r.results))

// export const getContractSpec = cid => getApiF(
//     `/_api/web/lists(guid'${CONTRACTS_LIST_ID}')/items?$filter=Id eq ${cid}&$select=Title,Area/Title,Contractor/Title,Consultant/Title&$expand=Area,Contractor,Consultant`
// )
//     .chain(path(r => r.results))

export const getTemplate = title => getApiF(
    `/_api/web/lists(guid'${TEMPLATE_LIST_ID}')/items?$filter=Title eq '${title}' and formType eq 'New'`
).chain(path(r => r.results))
