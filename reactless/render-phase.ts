import * as constants from "./constants"
import { commitRoot, setWipRoot } from "./commit-phase"

export let nextUnitOfWork: FiberNode | null = null;
export let wipRoot: FiberNode | null = null;

function createDom(fiber: FiberNode): Node {
    if (fiber.type === constants.TEXT_ELEMENT) {
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
    while (nextUnitOfWork && deadline.timeRemaining() > 1) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }

    if (!nextUnitOfWork && wipRoot) {
        setWipRoot(wipRoot);
        commitRoot();
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

export function startRenderLoop() {
    requestIdleCallback(workLoop);
}
