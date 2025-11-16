import * as constants from "./constants"
import { commitRoot, setWipRoot, getCurrentRoot, setDeletions } from "./commit-phase"

export let nextUnitOfWork: FiberNode | null = null;
export let wipRoot: FiberNode | null = null;
export let deletions: FiberNode[] = [];

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

function reconcileChildren(wipFiber: FiberNode, elements: ReactlessElement[]) {
    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling: FiberNode | null = null;

    while (index < elements.length || oldFiber != null) {
        const element = elements[index];
        let newFiber: FiberNode | null = null;

        const sameType = oldFiber && element && element.type === oldFiber.type;

        if (sameType && oldFiber) {
            newFiber = {
                type: oldFiber.type,
                dom: oldFiber.dom,
                parent: wipFiber,
                child: null,
                sibling: null,
                props: element.props,
                alternate: oldFiber,
                effectTag: "UPDATE",
            };
        }

        if (element && !sameType) {
            newFiber = {
                type: element.type,
                dom: null,
                parent: wipFiber,
                child: null,
                sibling: null,
                props: element.props,
                alternate: null,
                effectTag: "PLACEMENT",
            };
        }

        if (oldFiber && !sameType) {
            oldFiber.effectTag = "DELETION";
            deletions.push(oldFiber);
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        if (index === 0) {
            wipFiber.child = newFiber;
        } else if (prevSibling && newFiber) {
            prevSibling.sibling = newFiber;
        }

        if (newFiber) {
            prevSibling = newFiber;
        }
        index++;
    }
}

function performUnitOfWork(fiber: FiberNode): FiberNode | null {
    if (fiber.type) {
        if (!fiber.dom) {
            fiber.dom = createDom(fiber);
        }
    }

    const elements = (fiber.props.children || []) as ReactlessElement[];
    reconcileChildren(fiber, elements);

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
        setDeletions(deletions);
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
        },
        alternate: getCurrentRoot(),
    };
    deletions = [];
    nextUnitOfWork = wipRoot;
}

export function startRenderLoop() {
    requestIdleCallback(workLoop);
}
