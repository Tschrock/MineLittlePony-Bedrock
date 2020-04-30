
/**
 * Polyfills `type` using the property descriptors from `polyfillType`.
 * @param type The base type to apply the polyfill to.
 * @param polyfillType The type that polyfills the base type.
 */
function applyPolyfill<TBase, TPoly extends TBase>(type: new () => TBase, polyfillType: new () => TPoly) {
    const polyfillDescriptors = Object.getOwnPropertyDescriptors(polyfillType.prototype);
    for(const key in polyfillDescriptors) {
        if (key !== "constructor") {
            if(!Object.getOwnPropertyDescriptor(type.prototype, key)) {
                console.log(`Applying polyfill descriptor '${key}' for type ${type.name}`);
                Object.defineProperty(type.prototype, key, polyfillDescriptors[key]);
            }
            else {
                console.log(`Skipping polyfill descriptor '${key}' for type ${type.name}`);
            }
        }
    }
}

/**
 * Fixes a type where `Type.prototype.constructor !== Type`
 * @param type The type to fix.
 */
function fixPrototypeConstructor<T>(type: new () => T) {
    Object.defineProperty(type.prototype, "constructor", {
        configurable: true,
        enumerable: false,
        value: type,
        writable: true
    });
}

/**
 * Gets the first matching previous sibling, if found
 * @param node The node
 * @param filterFunction The filter function
 */
function getFirstMatchingPreviousSibling(node: Node, filterFunction: (node: Node) => boolean): Node | null {
    for (let s = node.previousSibling; s !== null; s = s.previousSibling) {
        if (filterFunction(s)) return s;
    }
    return null;
}

/**
 * Gets the first matching next sibling, if found
 * @param node The node
 * @param filterFunction The filter function
 */
function getFirstMatchingNextSibling(node: Node, filterFunction: (node: Node) => boolean): Node | null {
    for (let s = node.nextSibling; s !== null; s = s.nextSibling) {
        if (filterFunction(s)) return s;
    }
    return null;
}

/**
 * Creates a new `DocumentFragment` containing the given `nodes`
 * @param nodes An array of nodes
 */
function createFragment(nodes: Node[]): DocumentFragment {
    const fragment = new DocumentFragment();
    for (const node of nodes) fragment.appendChild(node);
    return fragment;
}

/**
 * Convert nodes into a node
 * https://dom.spec.whatwg.org/#converting-nodes-into-a-node
 * @param nodes The nodes
 */
function convertNodesIntoNode(nodes: Array<Node | string>): Node {
    const trueNodes = nodes.map(n => typeof n === "string" ? new Text(n) : n);
    if (trueNodes.length === 1) return trueNodes[0];
    else return createFragment(trueNodes);
}



fixPrototypeConstructor(EventTarget);
fixPrototypeConstructor(Node);

class ElementPolyfill extends Element {

    /**
     * ChildNode.after()
     * - https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/after
     * - https://dom.spec.whatwg.org/#dom-childnode-after
     */
    after(...nodes: (Node | string)[]): void {
        const parent = this.parentNode; // 1
        if (parent === null) return; // 2
        let viableNextSibling = getFirstMatchingNextSibling(this, n => !nodes.includes(n)); // 3
        const node = convertNodesIntoNode(nodes); // 4
        parent.insertBefore(node, viableNextSibling); // 5
    }

    /**
     * ParentNode.append()
     * - https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/append
     * - https://dom.spec.whatwg.org/#dom-parentnode-append
     */
    append(...nodes: (Node | string)[]): void {
        const node = convertNodesIntoNode(nodes); // 1
        this.appendChild(node); // 2
    }

    /**
     * ChildNode.before()
     * - https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/before
     * - https://dom.spec.whatwg.org/#dom-childnode-before
     */
    before(...nodes: (Node | string)[]): void {
        const parent = this.parentNode; // 1
        if (parent === null) return; // 2
        let viablePreviousSibling = getFirstMatchingPreviousSibling(this, n => !nodes.includes(n)); // 3
        const node = convertNodesIntoNode(nodes); // 4
        viablePreviousSibling = viablePreviousSibling === null ? parent.firstChild : viablePreviousSibling.nextSibling; // 5
        parent.insertBefore(node, viablePreviousSibling); // 6
    }

    /**
     * ParentNode.prepend()
     * - https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/prepend
     * - https://dom.spec.whatwg.org/#dom-parentnode-prepend
     */
    prepend(...nodes: (Node | string)[]): void {
        const node = convertNodesIntoNode(nodes); // 1
        this.insertBefore(node, this.firstChild); // 2
    }

    /**
     * ChildNode.remove()
     * - https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove
     * - https://dom.spec.whatwg.org/#dom-childnode-remove
     */
    remove() {
        if (this.parentNode === null) return; // 1
        this.parentNode.removeChild(this); // 2
    }

    /**
     * ChildNode.replaceWith()
     * - https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/replaceWith
     * - https://dom.spec.whatwg.org/#dom-childnode-replacewith
     */
    replaceWith(...nodes: (Node | string)[]): void {
        const parent = this.parentNode; // 1
        if (parent === null) return; // 2
        const viableNextSibling = getFirstMatchingNextSibling(this, n => !nodes.includes(n)); // 3
        const node = convertNodesIntoNode(nodes); // 4
        if (this.parentNode === parent) parent.replaceChild(node, this); // 5
        else parent.insertBefore(node, viableNextSibling); // 6
    }

    /**
     * Element.toggleAttribute()
     * - https://developer.mozilla.org/en-US/docs/Web/API/Element/toggleAttribute
     * - https://dom.spec.whatwg.org/#dom-element-toggleattribute
     */
    toggleAttribute(qualifiedName: string, force?: boolean): boolean {
        if (force !== void 0) force = !!force

        if (this.hasAttribute(qualifiedName)) {
            if (force) return true;

            this.removeAttribute(qualifiedName);
            return false;
        }
        if (force === false) return false;

        this.setAttribute(qualifiedName, "");
        return true;
    };

}

applyPolyfill(Element, ElementPolyfill);
fixPrototypeConstructor(Element);

class HTMLElementPolyfill extends HTMLElement {

    /**
     * HTMLElement.click()
     * - https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/click
     * - https://html.spec.whatwg.org/multipage/interaction.html#dom-click
     */
    click() {
        this.dispatchEvent(new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: this.ownerDocument?.defaultView
        }));
    }

}

applyPolyfill(HTMLElement, HTMLElementPolyfill);
fixPrototypeConstructor(HTMLElement);
