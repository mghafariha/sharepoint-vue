// @flow
import R from 'ramda'
import uuidv1 from 'uuid/v1'
import moment from 'moment-jalaali'

import { getFieldsList, getItems, getFilteredItems, saveFieldItems, getTemplate, getListData } from '../api'

// [{Guid: 1}, ...] -> {1: {}, ...}
export const transformFieldsList = R.pipe(
    R.groupBy(f => f.Guid),
    R.map(R.head)
)

// {DefaultValue: 1} -> {DefaultValue: 1, value: 1}
const assignValue = R.pipe(
    R.juxt([f => (f.Type == 'CustomComputedField') ? null : R.prop('DefaultValue', f), R.identity]),
    x => R.assoc('value', ...x)
)

function setListTitle ({ commit, state }) {
    return getListData(state.listId)
        .fork(
            err  => commit('addError', err),
            listData => commit('setListData', listData)
        )
}

export function loadFields ({ commit, state, getters }) {
    return new Promise((resolve, reject) => {
        getFieldsList(state.listId, 0, state.contentTypeId)
            .map(R.prop('fields'))
            .map(R.map(assignValue))
            .map(transformFieldsList)
            .fork(
                err => {
                    commit('addError', err)
                    reject(err)
                },
                res => {
                    setListTitle({ commit, state })
                    commit('loadFields', res)
                    if (!getters.isThereDetails) {
                        commit('setLoadingFalse')
                    }
                    resolve(res)
                }
            )
    })
}

export function loadOptions({ commit }, { id, listId }) {
    return getItems(listId)
        .fork(
            err     => commit('addError', err),
            options => commit('loadOptions', { id, options })
        )
}

export function loadFilteredOptions({ commit }, { id, listId, query }) {
    if (!query.includes('null')) {
        return getFilteredItems(listId, query)
            .fork(
                err     => commit('addError', err),
                options => commit('loadOptions', { id, options })
            )
    }
}

// export function loadContractSpec({ commit, state }){
//     return getContractSpec(state.contractId)
//         .map(R.head) //TODO: should change for deployment!
//         .fork(
//             err => commit('addError', err),
//             res => commit('loadContractSpec', res)
//         )
// }

export function changeField({ commit }, payload) {
    commit('changeField', payload)
}

export function loadComputed ({ commit }, { id, listId, query , select , func }) {
    let realFunc = computeFunction(func)
    if (!query.includes('null')) {
        return getFilteredItems(listId, query)
            .map(x => Array.isArray(x) ? x : [x])
            .map(R.map(R.prop(select)))
            .map(R.filter(R.identity))
            .fork(
                err      => commit('addError', err),
                computed => {
                    let value = realFunc(computed)
                    commit('changeField', { id, value })
                }
            )
    }
    commit('changeField', { id, value: '' })
}

export function MDLoadFields ({ commit, state }, { id, listId } ) {
    return new Promise((resolve, reject) => {
        getFieldsList(listId, '', state.dContentTypeId)
            .map(R.map(assignValue))
            .map(transformFieldsList)
            .fork(
                err => {
                    commit('addError', err);
                    reject(err);
                },
                fields => {
                    commit('MDLoadFields', { id, fields })
                    commit('setLoadingFalse')
                    resolve(fields)
                }
            )
    })
}

export function MDChangeFieldRow ({ commit }, payload) {
    commit('MDChangeFieldRow', payload)
}

export function MDLoadOptions ({ state, commit }, { id, masterId, rowId, listId }) {
    return getItems(listId)
        .fork(
            err     => {
                err ? commit('addError', err+'<'+state.fields[masterId]['rows'][rowId][id]['InternalName']+'> field')
                    : commit('addError','<'+state.fields[masterId]['rows'][rowId][id]['InternalName']+'> field')
            },
            options => commit('MDLoadOptions', { id, masterId, rowId, options })
        )
}

function MDLoadLookupOptions ({ commit }, { masterId, id, listId }) {
    return getItems(listId)
        .fork(
            err     => commit('addError', err),
            options => commit('MDLoadLookupOptions', { id, masterId, options })
        )
}

export function MDLoadAllLookupOptions ({ commit, state }, { masterId } ) {
    R.pipe (
        R.filter(R.propSatisfies(R.either(R.equals('Lookup'), R.equals('LookupMulti')), 'Type')),
        R.mapObjIndexed(
            (v, id) =>
                MDLoadLookupOptions({ commit },
                                    { id, masterId, listId: v.LookupList })
        )
    )(state.fields[masterId].fields)
}

export function MDLoadFilteredOptions ({ state, commit }, { id, masterId, rowId, listId, query }) {
    return query.includes('null')
        ? commit('MDLoadOptions', { id, masterId, rowId, options: null })
    : getFilteredItems(listId, query)
        .fork (
            err     => {
                err ? commit('addError', err+' ***there is an error in <'+state.fields[masterId]['rows'][rowId][id]['InternalName']+'> field')
                    : commit('addError','There is an error in <'+state.fields[masterId]['rows'][rowId][id]['InternalName']+'> field')
            },
            options => commit('MDLoadOptions', { id, masterId, rowId, options })
        )
}

export function MDAddRow ({ commit, state }, { id }) {
    let rowId = uuidv1()
    commit('MDAddRow', { id, rowId })
}

export function MDDelRow ({ commit }, rowProps) {
    commit('MDDelRow', rowProps)
}

const computeFunction = func => inArr => {
    const isDate = (typeof inArr[0] == 'string' && inArr[0].slice(4, 5) === '-')
    let arr = isDate ?
        R.map(x => new Date(x), inArr)
        : inArr
    switch(func) {
    case 'Sum':
        return R.sum(arr)
    case 'Multi':
        return R.product(arr)
    case 'Avg':
        return R.mean(arr)
    case 'Min':
        return isDate ?
            moment(new Date(Math.min.apply(null, arr))).format('jYYYY/jMM/jDD')
            : arr.length == 0 ? '' : R.reduce(R.min, Number.MAX_SAFE_INTEGER, arr)
    case 'Max':
        return isDate ?
            moment(new Date(Math.max.apply(null, arr))).format('jYYYY/jMM/jDD')
            : arr.length == 0 ? '' : R.reduce(R.max, Number.MIN_SAFE_INTEGER, arr)
    case 'First':
        return R.head(arr)
    }
}

export function MDLoadComputed ({ commit }, { id, masterId, rowId, listId, query , select , func }) {
    let realFunc = computeFunction(func)
    if (!query.includes('null')) {
        return getFilteredItems(listId, query)
            .map(x => Array.isArray(x) ? x : [x])
            .map(R.map(R.prop(select)))
            .map(R.filter(R.identity))
            .fork(
                err      => commit('addError', err),
                computed => {
                    let value = realFunc(computed)
                    commit('MDChangeFieldRow', { masterId, rowId, fieldId: id, value })
                }
            )
    }
    commit('MDChangeFieldRow', { masterId, rowId, fieldId: id, value: null })
}

const transFormFields= R.pipe(
    R.values,
    R.project(['InternalName', 'Type', 'value', 'rows', 'LookupList']),
    R.map(R.map(f => f == null ? '' : f)), // remove null values
    R.map(f => f.rows == '' ? R.assoc('rows', [], f) : f), // replace rows null value with empty array
    R.map(f => (f.InternalName == 'ID' && f.value == '') ? R.assoc('value', 0, f) : f), // replace ID of null with 0 value
    R.reject(R.propEq('value', '')),
    R.reject(R.propEq('Type', 'File'))
)

const transFormRows = R.map(
    R.ifElse(
        R.propEq('Type', 'MasterDetail'),
        field => R.assoc('rows', R.values(R.map(transFormFields, field.rows)), field),
        R.identity
    )
)

const transFormForSave = R.pipe(
        transFormFields,
        transFormRows
)

export function saveData ({ commit, state }) {
    let data = transFormForSave(state.fields)
    commit('setLoadingTrue')
    return new Promise((resolve, reject) => {
        saveFieldItems(state.listId, data, R.values(state.addFiles))
            .fork(
                err  => {
                    commit('addError', 'در عملیات ذخیره سازی خطای شبکه رخ داد مجددا ذخیره کنید')
                    commit('setLoadingFalse')
                    reject(err)
                },
                succ => {
                    commit('setLoadingFalse')
                    resolve(succ)
                }
            )
    })
}

export function removeError ({ commit }, error) {
    commit('removeError', error)
}

export function loadTemplateMetaData({ commit, state }) {
    return getTemplate(state.listId)
        .map(R.head)
        .fork(
            err  => commit('loadTemplateMetaData', { templateName: 'SimpleColumn', columnsNum: 2, template: '' + err }),
            succ => {
                let fields = transformFields(state.fields)
                let firstTemplate = replaceTemplateStr(succ.template || '', fields)
                let template = firstTemplate.replace(
                    new RegExp(/{{(\w+)(:[^}:]+)(:\[.*\])}}/, 'g'),
                    (s, fname, shFields, headers) => {
                        let showFields = shFields.substr(1).split(',')
                        let headersArr = headers.substr(1)
                        let field = fields[fname]
                        return `<el-form label-position="top">
                                    <el-form-item>
                                        <div class='detail-title'>${field.title}</div>
                                            <Field fieldId='${field.id}' class="${fname}" showFields="${showFields}" headers='${headersArr}'></Field>
                                            <div class='detail-item'>
                                        </div>
                                    </el-form-item>
                                </el-form>`
                    }
                )
                commit('loadTemplateMetaData', {
                    templateName: succ.templateName || 'SimpleColumn',
                    columnsNum: succ.columnsNum || 2,
                    template
                })
            }
        )
}

const transformFields= R.pipe(
    R.values,
    R.reduce((acc, curr) => ({
        ...acc,
        [curr.InternalName]: {
            'id': curr.Guid,
            'title': curr.Title,
            'intName': curr.InternalName,
            'isRequire': curr.IsRequire
        }
    }), {})
)

const replaceTemplateStr = (str, fields) => R.reduce(
    (q, field) => R.replace(
        new RegExp('{{'+field+'}}', 'g'),
        `<el-form label-position="top" class="master-field">
            <el-form-item :class="{require: ${fields[field].isRequire}}">
            <div class='master-title'>${fields[field].title}</div>
            <div class='master-item'>
                <Field fieldId="${fields[field].id}" class="${field}" ></Field>
            </div>
            </el-form-item>
        </el-form>`,
        q),
    str,
    R.keys(fields)
)

export function removeServerError({ commit }, { row, internalName }){
    commit('removeServerError', { row, internalName })
}

export function loadServerErrors({ commit }, errors){
    errors = R.chain(transformError, errors)
    commit('loadServerErrors', errors)
}

const transformError = ({ Message, RowNumber, FieldNames }) => {
    return R.map(field => {
        return {
            Message,
            RowNumber,
            InternalName: field,
            RelatedFields: FieldNames
        }
    }, FieldNames)
}

export function addError({ commit }, err) {
    commit('addError', err)
}

export function addToAddFiles({ commit }, payload ){
    commit('addToAddFiles', payload)
}

export function removeFromAddFiles({ commit }, id ){
    commit('removeFromAddFiles', id)
}
