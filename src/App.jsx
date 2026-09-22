import React, { useState } from 'react';

const ROW_TYPES = [
  { id: 1, name: '1: Text only without label', template: '"%s"', example: 'state.text' },
  { id: 2, name: '2: Label & textview & unit (Read-only)', template: '%.2f,V', example: 'state.voltage' },
  { id: 3, name: '3: Label & text input & unit', template: '%s', example: 'state.string_val' },
  { id: 4, name: '4: Label & number input & unit', template: '%d,A', example: 'state.current' },
  { id: 5, name: '5: Label & decimal input & unit', template: '%.2f,C', example: 'state.temp' },
  { id: 6, name: '6: Label & signed decimal input & unit', template: '%+.4f,°', example: 'state.latitude' },
  { id: 7, name: '7: Label & options (Dropdown)', template: '%d,Opt1,Opt2,Opt3', example: 'state.mode' }
];

export default function ProtocolBuilder() {
  const [sections, setSections] = useState([
    { id: 0, name: 'System' },
    { id: 1, name: 'Lantern' },
    { id: 2, name: 'AIS' },
    { id: 3, name: 'Racon' }
  ]);

  const [rows, setRows] = useState([
    { id: 1, secId: 0, type: 2, label: 'Main Batt', template: '%.2f,V', vars: 'state.sensory.lantern_voltage_v' },
    { id: 2, secId: 1, type: 7, label: 'Lantern Mode', template: '%d,Local,SC35,LH,ASO', vars: 'state.config.lantern_monitor' }
  ]);

  const addSection = () => {
    const newId = sections.length > 0 ? Math.max(...sections.map(s => s.id)) + 1 : 0;
    setSections([...sections, { id: newId, name: `Section ${newId + 1}` }]);
  };

  const updateSection = (id, name) => {
    setSections(sections.map(s => (s.id === id ? { ...s, name } : s)));
  };

  const removeSection = (id) => {
    setSections(sections.filter(s => s.id !== id));
    setRows(rows.filter(r => r.secId !== id));
  };

  const addRow = (secId) => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows([...rows, { id: newId, secId, type: 2, label: 'New Row', template: '%.2f,V', vars: 'state.value' }]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => {
      if (r.id === id) {
        const updatedRow = { ...r, [field]: value };
        // Auto-fill template hints when type changes
        if (field === 'type') {
          const typeDef = ROW_TYPES.find(t => t.id === parseInt(value));
          if (typeDef) updatedRow.template = typeDef.template;
        }
        return updatedRow;
      }
      return r;
    }));
  };

  const removeRow = (id) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const generateCppCode = () => {
    const secNames = sections.map(s => s.name).join(',');
    
    let cpp = `// Auto-Generated Protocol Builder Code\n`;
    cpp += `char buf[1024];\n`;
    cpp += `uint32_t ms_id = millis();\n\n`;
    cpp += `// --- Header & Section Definitions ---\n`;
    cpp += `int len = snprintf(buf, sizeof(buf),\n`;
    cpp += `    "head|op:%s|id:%lu|stat:0|sec:${sections.length}|${secNames}|row:${rows.length}|",\n`;
    cpp += `    isInit ? "init" : "report", ms_id);\n\n`;

    sections.forEach(sec => {
      const secRows = rows.filter(r => r.secId === sec.id);
      if (secRows.length > 0) {
        cpp += `// --- Section ${sec.id}: ${sec.name} ---\n`;
        secRows.forEach((row, index) => {
          const rowInSec = index + 1; // Enforce [row#insec] format
          cpp += `len += snprintf(buf+len, sizeof(buf)-len, "${row.secId}:${rowInSec}:${row.type}:${row.label}:${row.template}|", ${row.vars});\n`;
        });
        cpp += `\n`;
      }
    });

    cpp += `return String(buf);`;
    return cpp;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-gray-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Panel: Configuration */}
        <div className="flex-1 space-y-6">
          <div className="bg-[#111] p-6 rounded-2xl border border-[#333] shadow-xl">
            <h1 className="text-2xl font-bold text-yellow-500 mb-2 tracking-wider">AtoN Protocol Builder</h1>
            <p className="text-sm text-gray-500 mb-6">Visually construct your pipe-delimited telemetry arrays.</p>

            <div className="space-y-8">
              {sections.map(sec => (
                <div key={sec.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
                  {/* Section Header */}
                  <div className="bg-[#222] px-4 py-3 flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="bg-yellow-600/20 text-yellow-500 font-mono text-xs px-2 py-1 rounded">SEC {sec.id}</span>
                      <input
                        type="text"
                        value={sec.name}
                        onChange={(e) => updateSection(sec.id, e.target.value)}
                        className="bg-transparent text-white font-bold outline-none placeholder-gray-600"
                        placeholder="Section Name"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => addRow(sec.id)} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded transition-colors">+ ROW</button>
                      <button onClick={() => removeSection(sec.id)} className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-500 px-3 py-1.5 rounded transition-colors">DEL SEC</button>
                    </div>
                  </div>

                  {/* Section Rows */}
                  <div className="p-4 space-y-3">
                    {rows.filter(r => r.secId === sec.id).length === 0 && (
                      <div className="text-center text-gray-600 text-sm py-4 font-mono">No rows in this section.</div>
                    )}
                    {rows.filter(r => r.secId === sec.id).map((row, index) => (
                      <div key={row.id} className="flex flex-col gap-3 p-3 bg-black border border-gray-800 rounded-lg relative group">
                        <button onClick={() => removeRow(row.id)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-1/4">
                            <span className="text-xs text-gray-500 font-mono">Row In Sec:</span>
                            <div className="w-full bg-[#111] border border-gray-800 rounded px-2 py-1 text-sm text-gray-400 font-mono cursor-not-allowed">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-3/4">
                            <span className="text-xs text-gray-500 font-mono">Type:</span>
                            <select value={row.type} onChange={(e) => updateRow(row.id, 'type', parseInt(e.target.value))} className="w-full bg-[#111] border border-gray-800 rounded px-2 py-1 text-xs outline-none focus:border-yellow-500 text-gray-300">
                              {ROW_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1 w-1/3">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Label</span>
                            <input type="text" value={row.label} onChange={(e) => updateRow(row.id, 'label', e.target.value)} className="bg-[#111] border border-gray-800 rounded px-2 py-1.5 text-sm outline-none focus:border-yellow-500" />
                          </div>
                          <div className="flex flex-col gap-1 w-1/3">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">C Template / Unit</span>
                            <input type="text" value={row.template} onChange={(e) => updateRow(row.id, 'template', e.target.value)} className="bg-[#111] border border-gray-800 rounded px-2 py-1.5 text-sm font-mono outline-none focus:border-yellow-500 text-blue-400" />
                          </div>
                          <div className="flex flex-col gap-1 w-1/3">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">C++ Variable</span>
                            <input type="text" value={row.vars} onChange={(e) => updateRow(row.id, 'vars', e.target.value)} className="bg-[#111] border border-gray-800 rounded px-2 py-1.5 text-sm font-mono outline-none focus:border-yellow-500 text-green-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button onClick={addSection} className="w-full py-4 border-2 border-dashed border-[#333] hover:border-yellow-600/50 rounded-xl text-gray-500 hover:text-yellow-500 font-bold text-sm tracking-widest transition-colors">
                + ADD NEW SECTION
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Code Output */}
        <div className="w-full lg:w-[500px] shrink-0 space-y-6">
          <div className="bg-[#111] p-6 rounded-2xl border border-[#333] shadow-xl sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">Generated C++ Source</h2>
              <button 
                onClick={() => navigator.clipboard.writeText(generateCppCode())}
                className="bg-yellow-600 hover:bg-yellow-500 text-black px-3 py-1.5 rounded text-xs font-bold transition-colors active:scale-95"
              >
                COPY CODE
              </button>
            </div>
            
            <div className="bg-[#050505] p-4 rounded-xl border border-gray-800 overflow-x-auto">
              <pre className="text-xs font-mono leading-relaxed text-gray-300">
                <code dangerouslySetInnerHTML={{ __html: generateCppCode().replace(/snprintf/g, '<span class="text-yellow-400">snprintf</span>').replace(/sizeof/g, '<span class="text-blue-400">sizeof</span>').replace(/String/g, '<span class="text-blue-400">String</span>') }}></code>
              </pre>
            </div>

            <div className="mt-6 bg-blue-900/10 border border-blue-900/30 rounded-xl p-4">
              <h3 className="text-xs font-bold text-blue-400 mb-2 uppercase">Type 7 (Dropdown) Helper</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                When using Type 7, the C Template should be formatted as <code className="text-white bg-black px-1 py-0.5 rounded">%d,Option 0,Option 1,Option 2</code>. The ESP32 variable passed to it should evaluate to an integer corresponding to the index of the option (0, 1, 2...).
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
