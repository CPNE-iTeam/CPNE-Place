import { API } from './api';
import { Popup } from './popup';

export class AuthManager {
    private signinButton: HTMLElement;
    private signupButton: HTMLElement;
    private signoutButton: HTMLElement;
    private publishButton: HTMLElement;
    private settingsButton: HTMLElement;

    constructor(
        signinButton: HTMLElement,
        signupButton: HTMLElement,
        signoutButton: HTMLElement,
        publishButton: HTMLElement,
        settingsButton: HTMLElement
    ) {
        this.signinButton = signinButton;
        this.signupButton = signupButton;
        this.signoutButton = signoutButton;
        this.publishButton = publishButton;
        this.settingsButton = settingsButton;
    }

    public async loadLoginData(): Promise<void> {
        const isLoggedIn = await API.isLoggedIn();
        this.signinButton.style.display = isLoggedIn ? 'none' : 'inline-block';
        this.signupButton.style.display = isLoggedIn ? 'none' : 'inline-block';
        this.signoutButton.style.display = isLoggedIn ? 'inline-block' : 'none';
        this.publishButton.style.display = isLoggedIn ? 'inline-block' : 'none';
        this.settingsButton.style.display = isLoggedIn ? 'inline-block' : 'none';
    }

    public setupEventListeners(): void {
        this.signinButton.addEventListener('click', () => Popup.openPopup('signinPopup'));
        this.signupButton.addEventListener('click', () => Popup.openPopup('signupPopup'));
        this.signoutButton.addEventListener('click', async () => {
            try {
                await API.logout();
                location.reload();
            } catch (error) {
                alert((error as Error).message);
            }
        });
        this.publishButton.addEventListener('click', () => Popup.openPopup('publishPopup'));
        this.settingsButton.addEventListener('click', () => Popup.openPopup('settingsPopup'));
    }
}
