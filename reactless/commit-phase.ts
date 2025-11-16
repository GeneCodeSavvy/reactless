let wipRoot: FiberNode | null = null;
let currentRoot: FiberNode | null = null;
let nextEffect: FiberNode | null = null;
let deletions: FiberNode[] = [];

export function setWipRoot(root: FiberNode | null) {
    wipRoot = root;
}

export function getWipRoot(): FiberNode | null {
    return wipRoot;
}

export function getCurrentRoot(): FiberNode | null {
    return currentRoot;
}

export function commitRoot() {
    if (!wipRoot) return;
    
    deletions.forEach(commitWork);
    nextEffect = wipRoot.child;
    requestIdleCallback(commitLoop);
}

export function setDeletions(newDeletions: FiberNode[]) {
    deletions = newDeletions;
}

function commitLoop(deadline: IdleDeadline) {
    if (nextEffect && deadline.timeRemaining() > 1) {
        nextEffect = commitUnitOfWork(nextEffect);
    }

    if (nextEffect) {
        requestIdleCallback(commitLoop);
    } else {
        currentRoot = wipRoot;
        wipRoot = null;
        deletions = [];
    }
}

function isProperty(key: string) {
    return key !== "children" && !key.startsWith("on");
}

function isEvent(key: string) {
    return key.startsWith("on");
}

function isNew(prev: any, next: any) {
    return (key: string) => prev[key] !== next[key];
}

function isGone(prev: any, next: any) {
    return (key: string) => !(key in next);
}

function updateDom(dom: Node, prevProps: PropsObject, nextProps: PropsObject) {
    const element = dom as HTMLElement;

    // Remove old or changed event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2);
            const handler = (prevProps as any)[name];
            if (typeof handler === 'function') {
                element.removeEventListener(eventType, handler);
            }
        });

    // Remove old properties
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(name => {
            (element as any)[name] = "";
        });

    // Set new or changed properties
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            (element as any)[name] = (nextProps as any)[name];
        });

    // Add new event listeners
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2);
            const handler = (nextProps as any)[name];
            if (typeof handler === 'function') {
                element.addEventListener(eventType, handler);
            }
        });
}

function commitWork(fiber: FiberNode | null) {
    if (!fiber) return;

    let domParentFiber = fiber.parent;
    while (domParentFiber && !domParentFiber.dom) {
        domParentFiber = domParentFiber.parent;
    }
    const domParent = domParentFiber?.dom;

    if (fiber.effectTag === "PLACEMENT" && fiber.dom != null && domParent) {
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
        updateDom(fiber.dom, fiber.alternate?.props || {}, fiber.props);
    } else if (fiber.effectTag === "DELETION" && domParent) {
        commitDeletion(fiber, domParent);
        return;
    }
}

function commitDeletion(fiber: FiberNode, domParent: Node) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom);
    } else if (fiber.child) {
        commitDeletion(fiber.child, domParent);
    }
}

function commitUnitOfWork(fiber: FiberNode): FiberNode | null {
    commitWork(fiber);

    if (fiber.child) return fiber.child;

    let nextFiber: FiberNode | null = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) return nextFiber.sibling;
        nextFiber = nextFiber.parent;
    }

    return null;
}
