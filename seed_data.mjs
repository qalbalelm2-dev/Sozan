import fs from 'fs';

function wrapRest(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(wrapRest) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = wrapRest(v);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

async function uploadDoc(docName, data) {
  const apiKey = 'AIzaSyAn6z4sDy1_sF-YmkLjA0Z1TQwU_iLClf4';
  const url = `https://firestore.googleapis.com/v1/projects/qalbalelm/databases/(default)/documents/qalbalelm_data/${docName}?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          data: wrapRest(data),
          updatedAt: { stringValue: new Date().toISOString() },
        },
      }),
    });
    console.log(`[Firestore Seed] ${docName}: status ${res.status}`);
  } catch (err) {
    console.warn(`[Firestore Seed] Error on ${docName}:`, err.message);
  }
}

async function main() {
  const path = fs.existsSync('dist/initial_platform_data.json')
    ? 'dist/initial_platform_data.json'
    : 'initial_platform_data.json';
  if (!fs.existsSync(path)) {
    console.log('No initial_platform_data.json found to seed.');
    return;
  }
  const raw = fs.readFileSync(path, 'utf8');
  const d = JSON.parse(raw);
  if (d.courses) await uploadDoc('courses', d.courses);
  if (d.settings) await uploadDoc('settings', d.settings);
  if (d.users) await uploadDoc('users', d.users);
  if (d.exams) await uploadDoc('exams', d.exams);
  console.log('✅ تم مزامنة بيانات المنصة بالكامل في السحابة بنجاح!');
}

main();
