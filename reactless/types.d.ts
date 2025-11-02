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

interface ReactlessElement {
    type: string;
    props: PropsObject;
}

type ElementProps = Partial<ElementAttributes> & BaseProps;

type PropsObject = ElementProps | TextElementProps;

type TextChild = string | number;

type ReactlessChild = ReactlessElement | TextChild;


type FiberNode = {
    type: string | undefined;
    dom: Node | null;
    parent: FiberNode | null;
    child: FiberNode | null;
    sibling: FiberNode | null;
    props: PropsObject;
}
