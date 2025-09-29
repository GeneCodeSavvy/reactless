type PropsObject = Partial<{
    title: string,
    children: string | string[],
    id: string,
    className: string,
}>

export function createElement<K extends keyof HTMLElementTagNameMap>(
    type: K,
    props: PropsObject = {}
): HTMLElementTagNameMap[K] {
    const element = document.createElement(type);

    if (props.id) element.id = props.id;
    if (props.title) element.title = props.title;
    if (props.className) element.className = props.className;
    if (props.children) {
        if (typeof props.children === 'string') {
            let textNode = document.createTextNode(props.children)
            element.appendChild(textNode)
        }
        for (let child of props.children) {
            let textNode = document.createTextNode(child)
            element.appendChild(textNode)
        }
    }

    return element;
}
