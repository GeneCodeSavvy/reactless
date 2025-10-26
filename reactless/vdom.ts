type TextChild = string | number;
type ReactlessChild = ReactlessElement | TextChild;

interface BaseProps {
    children?: ReactlessChild[];
}

interface ElementAttributes {
    title: string;
    id: string;
    className: string;
}

interface TextElementProps extends BaseProps {
    nodeValue: string;
}

type ElementProps = Partial<ElementAttributes> & BaseProps;

type PropsObject = ElementProps | TextElementProps;

type FiberNode = {
    type: string | undefined;
    dom: Node | null;
    parent: FiberNode | null;
    child: FiberNode | null;
    sibling: FiberNode | null;
    props: PropsObject;
}

type ReactlessElement = {
    type: string;
    props: PropsObject;
}

const TEXT_ELEMENT = 'TEXT_ELEMENT';

function createTextElement(text: TextChild): ReactlessElement {
    return {
        type: TEXT_ELEMENT,
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

function createDom(fiber: FiberNode): Node {
    if (fiber.type === TEXT_ELEMENT) {
        const props = fiber.props as TextElementProps;
        return document.createTextNode(props.nodeValue);
    }

    const dom = document.createElement(fiber.type || 'div');
    const props = fiber.props as ElementProps;

    if (props.id) dom.id = props.id;
    if (props.title) dom.title = props.title;
    if (props.className) dom.className = props.className;

    return dom;
}

let nextUnitOfWork: FiberNode | null = null;
let wipRoot: FiberNode | null = null;
let currentRoot: FiberNode | null = null;

function commitRoot() {
    if (!wipRoot) return;
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null;
}

function commitWork(fiber: FiberNode | null) {
    if (!fiber) return;

    let parentFiber = fiber.parent;
    while (parentFiber && !parentFiber.dom) {
        parentFiber = parentFiber.parent;
    }
    const parentDom = parentFiber?.dom as Node | undefined;
    if (fiber.dom && parentDom) {
        parentDom.appendChild(fiber.dom);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function performUnitOfWork(fiber: FiberNode): FiberNode | null {
    if (fiber.type) {
        if (!fiber.dom) {
            fiber.dom = createDom(fiber);
        }
    }

    const elements = (fiber.props.children || []) as ReactlessElement[];
    let prevSibling: FiberNode | null = null;

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (!element) continue;
        const newFiber: FiberNode = {
            type: element.type,
            dom: null,
            parent: fiber,
            child: null,
            sibling: null,
            props: element.props,
        };

        if (i === 0) {
            fiber.child = newFiber;
        } else if (prevSibling) {
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
    }

    if (fiber.child) return fiber.child;
    let nextFiber: FiberNode | null = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) return nextFiber.sibling;
        nextFiber = nextFiber.parent;
    }
    return null;
}

function workLoop(deadline: IdleDeadline) {
    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }

    while (nextUnitOfWork && deadline.timeRemaining() > 1) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }

    requestIdleCallback(workLoop);
}

export function render(container: HTMLElement, element: ReactlessElement) {
    wipRoot = {
        type: undefined,
        dom: container,
        parent: null,
        child: null,
        sibling: null,
        props: {
            children: [element]
        }
    };
    nextUnitOfWork = wipRoot;
}

requestIdleCallback(workLoop);
