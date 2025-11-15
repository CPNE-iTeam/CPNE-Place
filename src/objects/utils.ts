export class Utils {

    static removeAllEventsListeners(element: HTMLElement): HTMLElement {
        const newElement = element.cloneNode(true) as HTMLElement;
        element.parentNode?.replaceChild(newElement, element);
        return newElement;
    }
}
