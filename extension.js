// This extensions shows Currency conversion on Gnome panel.
//Copyright (C) 2025  davefx
// See LICENSE file

'use strict';

import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { ModalDialog } from 'resource:///org/gnome/shell/ui/modalDialog.js';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

let session;

export default class CurrencyConverterExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._settingsChangedId = null;

        this._button = null;
        this._label = null;
        this._refreshTimeout = null;
        this._indicator = null;
    }

    enable() {
        this._settings = this.getSettings('org.gnome.shell.extensions.dfx-currency-converter');

        this._button = new PanelMenu.Button(0.0, 'DFX Currency Converter', false);

        this._label = new St.Button({
            style_class: 'currency-label',
            label: 'Loading...',
            reactive: true,
            can_focus: true,
            track_hover: true,
        });

        this._label.connect('clicked', () => {
            this._openChartWindow();
        });

        this._button.add_child(this._label);


        this._settingsChangedId = this._settings.connect('changed', () => {
            this._updateConversion();
        });

        // Compatible with GNOME 47 and 48+
        this._indicator = Main.panel.addToStatusArea('dfx-currency-converter', this._button, 0, 'center');

        this._refreshRateSeconds = 30;
        this._updateConversion();
        this._refreshTimeout = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            this._refreshRateSeconds,
            () => {
                this._updateConversion();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    disable() {
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        if (this._refreshTimeout) {
            GLib.Source.remove(this._refreshTimeout);
            this._refreshTimeout = null;
        }

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._button = null;
        this._label = null;

        if (session) {
            session.abort();
            session = null;
        }

        this._settings = null;

    }

    _updateConversion() {
        const source = this._settings.get_string('source-currency');
        const target = this._settings.get_string('target-currency');
        const apiKey = this._settings.get_string('api-key');

        if (!session) {
            session = new Soup.Session();
        }

        let url = `https://economia.awesomeapi.com.br/last/${source}-${target}`;
        // Add API key if provided
        if (apiKey && apiKey.trim() !== '') {
            url += `?token=${encodeURIComponent(apiKey)}`;
        }
        
        const message = Soup.Message.new('GET', url);

        session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (sourceObj, res) => {
            try {
                const bytes = session.send_and_read_finish(res);
                const response = new TextDecoder().decode(bytes.get_data());
                const json = JSON.parse(response);

                const key = `${source}${target}`;
                const rate = parseFloat(json[key].bid).toFixed(3);

                this._label.set_label(`1 ${source} = ${rate} ${target}`);
            } catch (e) {
                console.log(`Currency fetch error: ${e}`);
                this._label.set_text('Error fetching rate');
            }
        });
    }

    _openChartWindow() {

        const source = this._settings.get_string('source-currency');
        const target = this._settings.get_string('target-currency');
        const apiKey = this._settings.get_string('api-key');

        let script_path = this.path + "/currency-chart.js";

        // Pass API key as a third argument if provided
        const args = ["gjs", script_path, source, target];
        if (apiKey && apiKey.trim() !== '') {
            args.push(apiKey);
        }

        GLib.spawn_async(null, args, null, GLib.SpawnFlags.SEARCH_PATH, null);
    }


}


