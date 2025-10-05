type TextChild = string | number;
type ReactlessChild = ReactlessElement | TextChild;

type PropsObject = Partial<{
    title: string,
    id: string,
    className: string,
}> & {
    children?: ReactlessChild[]
}

type ReactlessElement = {
    type: string;
    props: PropsObject;
}

type FiberNode = {
    type: string | undefined;
    dom: Node | null;
    parent: FiberNode | null;
    child: FiberNode | null;
    sibling: FiberNode | null;
    props: PropsObject;
}

const TEXT_ELEMENT = 'TEXT_ELEMENT';

function createTextElement(text: TextChild): ReactlessElement {
    return {
        type: TEXT_ELEMENT,
        props: {
            nodeValue: String(text),
            children: []
        } as PropsObject
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
    const dom = fiber.type === TEXT_ELEMENT
        ? document.createTextNode((fiber.props as any)?.nodeValue ?? '')
        : document.createElement(fiber.type || 'div');

    const { id, title, className } = fiber.props as any;
    if (id) (dom as any).id = id;
    if (title) (dom as any).title = title;
    if (className) (dom as any).className = className;

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
