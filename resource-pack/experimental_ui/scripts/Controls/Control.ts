
// General type helpers
// https://stackoverflow.com/a/49579497
type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B;
type WritableKeys<T> = { [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, T[P]> };

// Type aliases to try and make the dynamic typing easier to read
type ElementNames = keyof HTMLElementTagNameMap;
type ElementWithName<TName extends ElementNames> = HTMLElementTagNameMap[TName];
type ElementPropertyNames<TName extends ElementNames> = keyof ElementWithName<TName>;
type ElementPropertyType<TName extends ElementNames, TPropName extends ElementPropertyNames<TName>> =
    ElementWithName<TName>[TPropName];
type WritableElementProperties<TName extends ElementNames> = WritableKeys<ElementWithName<TName>>;
// type WritableElementPropertyNames<TName extends ElementNames> = keyof WritableElementProperties<TName>[keyof ElementWithName<TName>];

type FilterFlags<Base, Condition> = {
    [Key in keyof Base]: Base[Key] extends Condition ? Key : never
};
type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base];

// Valid content types for operations that accept content
export type TagContent<TagName extends ElementNames = ElementNames> = string | ElementWithName<TagName> | Control<TagName>;

/**
 * An html tag builder
 */
export class Control<TagName extends ElementNames> {

    protected readonly element: ElementWithName<TagName>;

    constructor(tag: TagName | ElementWithName<TagName>) {
        if (typeof tag === "string") this.element = document.createElement(tag);
        else this.element = tag;
    }

    /**
     * Gets the built HTMLElement.
     */
    public get() {
        return this.element;
    }

    // Generic Helpers

    /**
     * Sets the value of a property.
     * @param name The name of the property.
     * @param value The value to set the property to.
     */
    public property<PropertyName extends ElementPropertyNames<TagName>>(
        name: PropertyName,
        value: ElementPropertyType<TagName, PropertyName>,
    ) {
        this.element[name] = value;
        return this;
    }

    /**
     * Sets the values of multiple properties.
     * @param properties An object containing properties to map onto the element.
     */
    public properties(properties: Partial<WritableElementProperties<TagName>>) {
        Object.assign(this.element, properties);
        return this;
    }

    /**
     * Sets the value of an attribute.
     * @param name The name of the attribute.
     * @param value The value to set the attribute to.
     */
    public attribute(name: string, value: string) {
        this.element.setAttribute(name, value);
        return this;
    }

    /**
     * Sets the value of multiple attributes.
     * @param attributes An object containing attributes to map onto the element.
     */
    public attributes(attributes: { [name: string]: string }) {
        Object.getOwnPropertyNames(attributes).forEach(name => this.element.setAttribute(name, attributes[name]));
        return this;
    }

    /**
     * Adds the given css classes.
     * @param classes The css classes to add.
     */
    public classes(...classes: string[]) {
        this.element.classList.add(...classes);
        return this;
    }

    /**
     * Sets a data attribute.
     * @param key The data key.
     * @param value The data value.
     */
    public data(key: string, value: string) {
        this.element.dataset[key] = value;
        return this;
    }

    /**
     * Sets an aria attribute.
     * @param key The aria key.
     * @param value The aria value.
     */
    public aria(key: string, value: string) {
        this.element.setAttribute(`aria-${key}`, value);
        return this;
    }

    // Shortcuts

    /**
     * Sets the id.
     * @param value The id.
     */
    public id(value: string) {
        return this.property("id", value);
    }

    /**
     * Sets the text content.
     * @param value The text content.
     */
    public text(value: string) {
        return this.property("innerText", value);
    }

    /**
     * Shows the element using the given display style.
     * @param display The display style.
     */
    public show(display: string = "block") {
        this.element.style.display = display;
    }

    /**
     * Hides the element.
     */
    public hide() {
        this.element.style.display = "none";
    }

    // Content

    /**
     * Adds content.
     * @param content The content to add.
     */
    public content(...content: Array<TagContent<ElementNames>>) {
        this.element.append(...content.map(c => c instanceof Control ? c.element : c));
        return this;
    }

    // Other

    /**
     * Runs a function over the element.
     * @param fn The function to run with the element.
     */
    public with(fn: (el: ElementWithName<TagName>) => unknown) {
        fn(this.element);
        return this;
    }

    /**
     * Binds an object's property with a property on the element.
     * @param elementProperty The name of the element property to bind to.
     * @param sourceObject The object that hosts the data binding.
     * @param sourceProperty The name of the object property to bind to.
     */
    public bindProperty<
        SourceType extends ElementWithName<TagName>,
        SourceKey extends keyof ElementWithName<TagName>,
        TargetType,
        TargetKey extends AllowedNames<TargetType, SourceType[SourceKey]>,
        >(
            sourceProperty: SourceKey,
            targetObject: TargetType & Record<TargetKey, SourceType[SourceKey]>,
            targetProperty: TargetKey & keyof TargetType,
    ) {
        this.element[sourceProperty] = targetObject[targetProperty];
        Object.defineProperty(targetObject, targetProperty, {
            get: () => this.element[sourceProperty],
            set: (newVal: SourceType[SourceKey]) => this.element[sourceProperty] = newVal,
        });
        return this;
    }

    // Events

    /**
     * Adds an event listener.
     * @param type The type of event.
     * @param listener The event listener.
     * @param options The event options.
     */
    public on(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ) {
        this.element.addEventListener(type, listener, options);
        return this;
    }

    /**
     * Removes an event listener.
     * @param type The type of event.
     * @param listener The event listener.
     * @param options The event options.
     */
    public off(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ) {
        this.element.removeEventListener(type, listener, options);
        return this;
    }

}
