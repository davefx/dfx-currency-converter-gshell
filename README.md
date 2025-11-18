# Currency Converter
```
Gnome-Shell v.(42, 43, 44, 45, 46, 47, 48, 49) Extension, for conversion of USD to EUR on the center of the top panel.
```
This is extension is a modified  version of https://github.com/shoaibzs/Dollar-PKR-43 extension to show any currency conversion combination instead of USD to PKR. 
```
# Licence
```
See LICENSE File
```
# How to install
```

Download via Gnome Extension Store: https://extensions.gnome.org/extension/6192/usd-try/

or

cd /tmp && git clone https://github.com/davefx/currency-converter-gshell.git && mv currency-converter-gshell currency-converter-gshell@davefx.github.com && cp -av currency-converter-gshell@davefx.github.com ~/.local/share/gnome-shell/extensions/ && gnome-shell-extension-tool --enable-extension currency-converter-gshell@davefx.github.com && rm -rf currency-converter-gshell@davefx.github.com



Last method is deprecated with the newer versions, just copy extension file to
```
~/.local/share/gnome-shell/extensions/
```
then restart GNOME Shell and run
```
gnome-extensions enable currency-converter-gshell@davefx.github.com
```
To restart GNOME Shell in X11, pressing Alt+F2 to open the Run Dialog and enter restart 
(or just r). 
In Wayland Logout and Login again.
