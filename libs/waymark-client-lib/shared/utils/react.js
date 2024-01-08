/**
 * A convenience method for ref attribute callbacks to create an
 * instance variable on a component that stores the ref.
 *
 * Example use:
 * class MyComponent extends React.Component
 *   componentDidMount: ->
 *     console.log(@inputElement.value)
 *
 *   render: ->
 *     return (
 *       <div>
 *         <input ref={createRef('inputElement', this)} />
 *       </div>
 *     )
 *
 * @param  {string} instanceVariableName  The name of the instance variable that will store the ref
 * @param  {React.Component} componentInstance  The componentInstance you'd like to store the ref on.
 * @return {function} The callback function to use with the ref attribute
 */
export const createRef = (instanceVariableName, componentInstance) => (element) => {
    const component = componentInstance;
    component[instanceVariableName] = element;
    return component;
};

/**
 * A convenience method for to deduce the name of a provided component.
 */
export const getComponentDisplayName = (Component) =>
    Component.displayName || Component.name || 'Component';