import {Utils} from './utils';



export class Popup {
    static openPopup(id: string): void {
        const el: HTMLElement | null = document.getElementById(id);
        if (!el) return;

        el.classList.remove('popup-hide');
        el.classList.add('popup-show');

        let closeButton: HTMLElement | null = el.querySelector('.popup-close');
        if (!closeButton) return;

        // Supprime tous les écouteurs existants et retourne l'élément
        closeButton = Utils.removeAllEventsListeners(closeButton);

        // Ajoute un nouvel écouteur pour fermer la popup
        closeButton?.addEventListener('click', () => {
            Popup.closePopup(id);
        });
    }


    static closePopup(id: string): void {
        const el: HTMLElement | null = document.getElementById(id);
        if (!el) return;

        el.classList.remove('popup-show');
        el.classList.add('popup-hide');
    }
}
