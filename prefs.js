'use strict';

import Gtk from 'gi://Gtk';
import Soup from 'gi://Soup';
import Adw from 'gi://Adw';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class CurrencyPrefs extends ExtensionPreferences {

    fillPreferencesWindow(window) {
        this._settings = this.getSettings('org.gnome.shell.extensions.dfx-currency-converter');

        window.connect('close-request', () => {
            // clean up here
            this._settings = null;
        });

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({ title: 'Currency Settings' });

        // FROM currency
        const fromRow = new Adw.ActionRow({ title: 'From currency', subtitle: 'Select source currency' });
        this._fromCombo = new Gtk.ComboBoxText({ visible: true });
        fromRow.add_suffix(this._fromCombo);
        fromRow.activatable_widget = this._fromCombo;

        // TO currency
        const toRow = new Adw.ActionRow({ title: 'To currency', subtitle: 'Select target currency' });
        this._toCombo = new Gtk.ComboBoxText({ visible: true });
        toRow.add_suffix(this._toCombo);
        toRow.activatable_widget = this._toCombo;

        // API Key
        const apiKeyRow = new Adw.ActionRow({ 
            title: 'API Key', 
            subtitle: 'Optional API key to avoid rate limiting (429 errors)' 
        });
        const apiKeyEntry = new Gtk.Entry({
            visible: true,
            placeholder_text: 'Enter API key (optional)',
            text: this._settings.get_string('api-key'),
            hexpand: true,
            valign: Gtk.Align.CENTER
        });
        apiKeyEntry.connect('changed', () => {
            this._settings.set_string('api-key', apiKeyEntry.get_text());
        });
        apiKeyRow.add_suffix(apiKeyEntry);
        apiKeyRow.activatable_widget = apiKeyEntry;

        // Refresh button
        const refreshButton = new Gtk.Button({
            label: "Refresh currencies",
            visible: true,
            halign: Gtk.Align.CENTER,
        });
        refreshButton.connect('clicked', () => {
            this._loadCurrencies();
        });

        group.add(fromRow);
        group.add(toRow);
        group.add(apiKeyRow);
        page.add(group);

	const extraGroup = new Adw.PreferencesGroup();
	const buttonBox = new Gtk.Box({
	    orientation: Gtk.Orientation.VERTICAL,
	    halign: Gtk.Align.CENTER,
	    margin_top: 12,
	    margin_bottom: 12,
	    visible: true,
	});
	buttonBox.append(refreshButton);
	extraGroup.add(buttonBox);
	page.add(extraGroup); 

        window.add(page);
        // Load currencies initially
        this._loadCurrencies();
    }

    _loadCurrencies() {
        const session = new Soup.Session();
        const apiKey = this._settings.get_string('api-key');
        let url = 'https://economia.awesomeapi.com.br/json/available/uniq';
        
        // Add API key if provided
        if (apiKey && apiKey.trim() !== '') {
            url += `?token=${encodeURIComponent(apiKey)}`;
        }
        
        const message = Soup.Message.new('GET', url);

        session.send_and_read_async(message, 0, null, (source, result) => {
            try {
                const bytes = session.send_and_read_finish(result);
                const response = new TextDecoder().decode(bytes.get_data());
                const json = JSON.parse(response);
                
                // Check if the response is an error (has status, code, message as top-level keys only)
                const keys = Object.keys(json);
                if ((keys.includes('status') || keys.includes('code') || keys.includes('message')) && keys.length <= 3) {
                    console.log(`API returned error: ${JSON.stringify(json)}`);
                    this._loadFallbackCurrencies();
                    return;
                }
                
                const currencies = Object.keys(json).sort();
                
                // Validate we got actual currencies (should have at least 10)
                if (currencies.length < 10) {
                    console.log(`Unexpected API response, got only ${currencies.length} currencies`);
                    this._loadFallbackCurrencies();
                    return;
                }

                // Clear previous entries
                this._fromCombo.remove_all();
                this._toCombo.remove_all();

                for (const c of currencies) {
                    this._fromCombo.append_text(c);
                    this._toCombo.append_text(c);
                }

                const currentFrom = this._settings.get_string('source-currency');
                const currentTo = this._settings.get_string('target-currency');

                this._fromCombo.set_active(currencies.indexOf(currentFrom) !== -1 ? currencies.indexOf(currentFrom) : 0);
                this._toCombo.set_active(currencies.indexOf(currentTo) !== -1 ? currencies.indexOf(currentTo) : 1);

                this._fromCombo.connect('changed', () => {
                    this._settings.set_string('source-currency', this._fromCombo.get_active_text());
                });

                this._toCombo.connect('changed', () => {
                    this._settings.set_string('target-currency', this._toCombo.get_active_text());
                });

            } catch (e) {
                console.log(`Currency fetch failed: ${e}`);
                this._loadFallbackCurrencies();
            }
        });
    }

    _loadFallbackCurrencies() {
        // Fallback list of common currencies if API fails
        const commonCurrencies = [
            'AED', 'ARS', 'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'COP',
            'DKK', 'EUR', 'GBP', 'HKD', 'IDR', 'INR', 'JPY', 'KRW',
            'MXN', 'NOK', 'NZD', 'PLN', 'RUB', 'SEK', 'SGD', 'THB',
            'TRY', 'USD', 'ZAR'
        ];

        // Clear previous entries
        this._fromCombo.remove_all();
        this._toCombo.remove_all();

        for (const c of commonCurrencies) {
            this._fromCombo.append_text(c);
            this._toCombo.append_text(c);
        }

        const currentFrom = this._settings.get_string('source-currency');
        const currentTo = this._settings.get_string('target-currency');

        this._fromCombo.set_active(commonCurrencies.indexOf(currentFrom) !== -1 ? commonCurrencies.indexOf(currentFrom) : commonCurrencies.indexOf('USD'));
        this._toCombo.set_active(commonCurrencies.indexOf(currentTo) !== -1 ? commonCurrencies.indexOf(currentTo) : commonCurrencies.indexOf('EUR'));

        this._fromCombo.connect('changed', () => {
            this._settings.set_string('source-currency', this._fromCombo.get_active_text());
        });

        this._toCombo.connect('changed', () => {
            this._settings.set_string('target-currency', this._toCombo.get_active_text());
        });
    }
}
