'use strict';
'require form';
'require poll';
'require rpc';
'require view';
'require fs';

const callServiceList = rpc.declare({
    object: 'service',
    method: 'list',
    params: ['name'],
    expect: { '': {} }
});

function getServiceStatus() {
    return L.resolveDefault(callServiceList('vlmcsd'), {}).then(res =>
        res?.[0]?.result[1]?.vlmcsd?.instances?.instance1?.running
    );
}

function renderStatus(status) {
    const color = status ? 'green' : 'red';
    const service = _('Vlmcsd KMS Server');
    const running = status ? _('RUNNING') : _('NOT RUNNING');
    return `<em><span style="color:${color}"><strong>${service} ${running}</strong></span></em>`;
}

return view.extend({
    render: function () {
        const m = new form.Map('vlmcsd', _('Vlmcsd KMS Server'));

        let s = m.section(form.TypedSection);
        s.anonymous = true;
        s.render = function () {
            poll.add(function () {
                return L.resolveDefault(getServiceStatus()).then(function (res) {
                    const status = res;
                    const stats = renderStatus(status);
                    const view = document.getElementById('vlmcsd_status');
                    view.innerHTML = stats;
                });
            });

            return E('div', { class: 'cbi-section', id: 'status_bar' }, [
                E('p', { id: 'vlmcsd_status' }, _('Collecting data…'))
            ]);
        };

        s = m.section(form.NamedSection, 'config', 'vlmcsd');
        s.tab('general', _('General Settings'));
        s.tab('config_file', _('Configuration File'), _('Edit the content of the /etc/vlmcsd/vlmcsd.ini file.'));

        s.taboption('general', form.Flag, 'enabled', _('Enable Vlmcsd KMS Server'), {
            default: true
        });
        s.taboption('general', form.Value, 'port', _('KMS Server Port'), {
            default: 1688,
            datatype: "number"
        }).placeholder = '1688';

        const o = s.taboption('config_file', form.TextValue, '_tmpl',
            null,
            _("This is the content of the file '/etc/vlmcsd/vlmcsd.ini', you can edit it here, usually no modification is needed."));
        o.rows = 20;
        o.cfgvalue = () => fs.trimmed('/etc/vlmcsd/vlmcsd.ini');
        o.write = (_, value) => fs.write('/etc/vlmcsd/vlmcsd.ini', value.trim().replace(/\r\n/g, '\n') + '\n');

        return m.render();
    }
});
