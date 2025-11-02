let wipRoot: FiberNode | null = null;
let currentRoot: FiberNode | null = null;
let nextEffect: FiberNode | null = null;

export function setWipRoot(root: FiberNode | null) {
    wipRoot = root;
}

export function getWipRoot(): FiberNode | null {
    return wipRoot;
}

export function commitRoot() {
    if (!wipRoot) return;
    nextEffect = wipRoot.child;
    requestIdleCallback(commitLoop);
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
    }
}

function commitUnitOfWork(fiber: FiberNode): FiberNode | null {
    let parentFiber = fiber.parent;
    
    const parentDom = parentFiber?.dom;
    if (fiber.dom && parentDom) {
        parentDom.appendChild(fiber.dom);
    }

    if (fiber.child) return fiber.child;

    let nextFiber: FiberNode | null = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) return nextFiber.sibling;
        nextFiber = nextFiber.parent;
    }

    return null;
}
