const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const outputFile = path.join(__dirname, 'supabase_schema_consolidated.sql');

console.log('Reading migrations from:', migrationsDir);

try {
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sorts chronologically by timestamp prefix

  console.log(`Found ${files.length} SQL migration files:`);
  files.forEach(f => console.log(` - ${f}`));

  // 0. Auto-Rename helper block at the top of the consolidated schema
  let consolidatedSql = `-- ========================================================\n`;
  consolidatedSql += `-- SELF-HEALING PRE-CHECK: RENAME user_uuid TO user_id\n`;
  consolidatedSql += `-- ========================================================\n\n`;
  consolidatedSql += `DO $$\n`;
  consolidatedSql += `DECLARE\n`;
  consolidatedSql += `    r RECORD;\n`;
  consolidatedSql += `BEGIN\n`;
  consolidatedSql += `    FOR r IN \n`;
  consolidatedSql += `        SELECT table_name, column_name \n`;
  consolidatedSql += `        FROM information_schema.columns \n`;
  consolidatedSql += `        WHERE table_schema = 'public' AND column_name = 'user_uuid'\n`;
  consolidatedSql += `    LOOP\n`;
  consolidatedSql += `        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || ' RENAME COLUMN user_uuid TO user_id';\n`;
  consolidatedSql += `    END LOOP;\n`;
  consolidatedSql += `END$$;\n\n`;

  files.forEach(file => {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    consolidatedSql += `-- ========================================================\n`;
    consolidatedSql += `-- MIGRATION: ${file}\n`;
    consolidatedSql += `-- ========================================================\n\n`;
    consolidatedSql += content;
    consolidatedSql += `\n\n`;
  });

  // Make the entire script idempotent to prevent "already exists" errors
  console.log('\nApplying idempotency rules to SQL...');

  // 1. CREATE TABLE -> CREATE TABLE IF NOT EXISTS
  consolidatedSql = consolidatedSql.replace(/CREATE TABLE\s+(?!IF NOT EXISTS)/gi, 'CREATE TABLE IF NOT EXISTS ');

  // 2. CREATE TYPE at the start of a line -> DO $$ BEGIN ... CREATE TYPE ... END$$;
  // Using 'm' flag and '^' to only match root-level statements and avoid double-wrapping nested ones
  consolidatedSql = consolidatedSql.replace(/^CREATE TYPE\s+(public\.)?(\w+)\s+AS\s+ENUM\s*\(([^)]+)\);/gim, (match, schema, typeName, values) => {
    const fullTypeName = schema ? `${schema}${typeName}` : typeName;
    return `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}') THEN
        CREATE TYPE ${fullTypeName} AS ENUM (${values});
    END IF;
END$$;`;
  });

  // 3. CREATE POLICY "policy_name" ON table_name -> DROP POLICY IF EXISTS ...; CREATE POLICY ...
  consolidatedSql = consolidatedSql.replace(/CREATE POLICY\s+"([^"]+)"\s+ON\s+([\w.]+)/gi, (match, policyName, tableName) => {
    return `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};\nCREATE POLICY "${policyName}" ON ${tableName}`;
  });

  // 4. CREATE TRIGGER trigger_name -> DROP TRIGGER IF EXISTS ...; CREATE TRIGGER ...
  consolidatedSql = consolidatedSql.replace(/CREATE TRIGGER\s+(\w+)\s+(BEFORE|AFTER)\s+(.*?)\s+ON\s+([\w.]+)/gi, (match, triggerName, timing, events, tableName) => {
    return `DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};\n${match}`;
  });

  // 5. ALTER TABLE ... ADD CONSTRAINT ... -> ALTER TABLE ... DROP CONSTRAINT IF EXISTS ...; ALTER TABLE ... ADD CONSTRAINT ...
  consolidatedSql = consolidatedSql.replace(/ALTER TABLE\s+([\w.]+)\s+ADD CONSTRAINT\s+(\w+)/gi, (match, tableName, constraintName) => {
    return `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${constraintName};\n${match}`;
  });

  // 6. CREATE [UNIQUE] INDEX -> CREATE [UNIQUE] INDEX IF NOT EXISTS
  consolidatedSql = consolidatedSql.replace(/CREATE\s+(UNIQUE\s+)?INDEX\s+(?!IF NOT EXISTS)/gi, (match, uniquePart) => {
    return `CREATE ${uniquePart || ''}INDEX IF NOT EXISTS `;
  });

  fs.writeFileSync(outputFile, consolidatedSql, 'utf8');
  console.log(`\n🎉 Success! Consolidating + Idempotent SQL schema written to: ${outputFile}`);
} catch (err) {
  console.error('❌ Error consolidating migrations:', err.message);
  process.exit(1);
}
