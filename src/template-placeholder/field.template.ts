export const FormGroupTemplate = `
  <div className="form-group row">
    @field_filters@
  </div>
`;

export const FieldTemplate = `@indent@<div className="col-lg-4">
@indent@  <label htmlFor="@field_name@">@~field_name~@</label>
@indent@  <Field
@indent@    name="@field_name@"
@indent@    component={Input}
@indent@    placeholder="Cari @~field_name~@.."
@indent@  />
@indent@  <ErrorMessage name="@field_name@" />
@indent@</div>
`;

export const FilterFieldTemplate = `@indent@<div className="col-lg-4">
@indent@  <label htmlFor="@field_name@">@~field_name~@</label>
@indent@  <Field
@indent@    name="@field_name@"
@indent@    component={Input}
@indent@    placeholder="Cari @~field_name~@.."
@indent@  />
@indent@  <small className="form-text">
@indent@    Cari <b>@~field_name~@</b>
@indent@  </small>
@indent@  <ErrorMessage name="@field_name@" />
@indent@</div>
`;

export const GenOptionLoaderTemplate = `function genOptionLoader(fetcher, mapper) {
@indent@return (inputValue, callback) => {
@indent@  fetcher(inputValue).then(({data: {data}}) => {
@indent@    const {items = []} = data ?? {}
@indent@
@indent@    const options = items.map(mapper);
@indent@    
@indent@    callback(options)
@indent@  });
@indent@}
}`

export const OptionLoaderTemplate = `function search@~reference_name~@(params) {
@indent@return new Promise((resolve) => resolve({data: {data: {item: []}}}));
}`

export const SelectFieldTemplate = `@indent@<div className="col-lg-4">
@indent@  <label htmlFor="@field_name@">@~reference_name~@</label>
@indent@  <AsyncSelect 
@indent@    name="@field_name@"
@indent@    defaultOptions={@reference_name@Options}
@indent@    loadOptions={genOptionLoader((input) => search@~reference_name~@(input), ({uuid, name}) => ({label: name, value: uuid}))}
@indent@    value={values.@reference_name@ ? {value: values.@reference_name@.uuid, label: values.@reference_name@.name} : {label: '', value: ''}}
@indent@    onChange={({label, value}) => {
@indent@      setFieldValue('@reference_name@', {uuid: value, name: label});
@indent@    }}
@indent@  />
@indent@  <ErrorMessage name="@field_name@" />
@indent@</div>
`;

export const FilterSelectFieldTemplate = `@indent@<div className="col-lg-4">
@indent@  <label htmlFor="@field_name@">Cari @~reference_name~@</label>
@indent@  <AsyncSelect 
@indent@    name="@field_name@"
@indent@    defaultOptions={@reference_name@Options}
@indent@    loadOptions={genOptionLoader((input) => search@~reference_name~@(input), ({uuid, name}) => ({label: name, value: uuid}))}
@indent@    value={values.@reference_name@ ? {value: values.@reference_name@.uuid, label: values.@reference_name@.name} : {label: '', value: ''}}
@indent@    onChange={({label, value}) => {
@indent@      setFieldValue('@reference_name@', {uuid: value, name: label});
@indent@    }}
@indent@  />
@indent@  <ErrorMessage name="@field_name@" />
@indent@</div>
`;

// ? Placeholder for @template_reference_options_preparations@
export const OptionLoaderPreparation = `@indent@(async () => {
@indent@  const [res] = await promiseTuplify(Promise.all([
@indent@    @template_fetch_options@
@indent@  ]));
@indent@     
@indent@  @template_options_setup@
@indent@})();`