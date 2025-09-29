type Child = string | HTMLElement;

type PropsObject = Partial<{
    title: string,
    id: string,
    className: string,
}>

function appendChild(parent: HTMLElement, child: Child) {
    if (typeof child === 'string') {
        const textNode = document.createTextNode(child);
        parent.appendChild(textNode);
    } else {
        parent.appendChild(child);
    }
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
    type: K,
    props: PropsObject = {},
    ...children: Child[]
): HTMLElementTagNameMap[K] {
    const element = document.createElement(type);

    if (props.id) element.id = props.id;
    if (props.title) element.title = props.title;
    if (props.className) element.className = props.className;

    for (const child of children.flat()) {
        if (typeof child === 'string' || child instanceof HTMLElement) {
            appendChild(element, child);
        }
    }

    return element;
}
