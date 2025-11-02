import * as constants from "./constants"

function createTextElement(text: TextChild): ReactlessElement {
    return {
        type: constants.TEXT_ELEMENT,
        props: {
            nodeValue: String(text),
            children: []
        } as TextElementProps
    } as ReactlessElement;
}

export function createElement(
    type: string,
    props: PropsObject = {},
    ...children: ReactlessChild[]
): ReactlessElement {
    const normalizedChildren = children
        .flat()
        .map(child => typeof child === 'object' ? child as ReactlessElement : createTextElement(child));

    return {
        type,
        props: {
            ...(props || {}),
            children: normalizedChildren as ReactlessElement[]
        }
    } as ReactlessElement;
}
