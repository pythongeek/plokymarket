#!/usr/bin/env python3
"""
Precise migration of admin API routes to requireAdminUser.
Only touches actual broken auth (not just dead code).
"""

import os, re

BASE = "/root/workspace/plokymarket"
ADMIN_DIR = f"{BASE}/apps/web/src/app/api/admin"

IMPORT_LINE = "import { requireAdminUser } from '@/lib/admin/admin-auth';\n"
LOCAL_DB_IMPORT_RE = re.compile(r"(import \{[^}]*\} from '@/lib/admin/local-db';\n)")

def add_import(content):
    if "from '@/lib/admin/admin-auth'" in content:
        return content, False
    content = LOCAL_DB_IMPORT_RE.sub(lambda m: m.group(1) + IMPORT_LINE, content)
    return content, True

def remove_dead_getUserFromToken(content):
    """Remove getUserFromToken function (with or without JSDoc)."""
    # With JSDoc comment block
    content = re.sub(
        r'/\*\*[\s\S]*?\*/\nasync function getUserFromToken\([^)]*\): [^\n]+\n\{[\s\S]*?\n\}\n',
        '\n', content
    )
    # Without JSDoc, starts after blank line
    content = re.sub(
        r'\n\nasync function getUserFromToken\([^)]*\): [^\n]+\n\{[\s\S]*?\n\}\n',
        '\n', content
    )
    # Without JSDoc, starts after import block (no leading newline)
    content = re.sub(
        r'\nasync function getUserFromToken\([^)]*\): [^\n]+\n\{[\s\S]*?\n\}\n',
        '\n', content
    )
    return content

def remove_dead_checkAdmin(content):
    """Remove checkAdmin function with if(false) inside."""
    # Match the entire function including body
    content = re.sub(
        r'\nasync function checkAdmin\([^)]*\): [^\n]+\n\{[\s\S]*?\n\}\n',
        '\n', content
    )
    return content

# ─── PATTERN A: getUserFromToken() called directly ───────────────────────────
# In users/route.ts GET handler:
A_GET_AUTH_BLOCK = """const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = await getUserFromToken(authHeader.split(' ')[1]);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin in local DB
        const profiles = await query<{ is_admin: boolean }>(
            'SELECT is_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        if (!profiles[0]?.is_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }"""

A_GET_REPLACEMENT = """const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;
        const userId = authResult.user.id;"""

# In users/route.ts PATCH handler:
A_PATCH_AUTH_BLOCK = """const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = await getUserFromToken(authHeader.split(' ')[1]);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profiles = await query<{ is_admin: boolean }>(
            'SELECT is_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        if (!profiles[0]?.is_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }"""

A_PATCH_REPLACEMENT = """const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;
        const userId = authResult.user.id;"""

# In ai-config/route.ts (exact format):
A_AICONFIG_AUTH_BLOCK = """const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = await checkAdmin(authHeader.split(' ')[1]);
        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Super Admin required' }, { status: 403 });
        }"""

A_AICONFIG_REPLACEMENT = """const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;
        const userId = authResult.user.id;"""

# Pattern B: checkAdmin with if(false) — variable indent
def make_pattern_b_replacement(indent):
    return f"{indent}const authResult = await requireAdminUser(req);\n{indent}if ('error' in authResult) return authResult.error;\n{indent}const userId = authResult.user.id;"

def migrate_pattern_b(content, auth_block, indent="        "):
    """Generic pattern B replacement."""
    admin_block = auth_block.replace("Bearer ')", "Bearer ')")
    replacement = make_pattern_b_replacement(indent)
    # Escape for regex (content already has the actual strings)
    # We need to find and replace the specific block
    return content.replace(auth_block, replacement)

# ─── PATTERN B variants ──────────────────────────────────────────────────────
# Many files have checkAdmin with if(false). The auth block looks like:
#   const authHeader = req.headers.get('authorization');
#   if (!authHeader?.startsWith('Bearer ')) { return 401; }
#   const admin = await checkAdmin(authHeader.split(' ')[1]);
#   if (!admin) { return 403; }

PATTERN_B_BLOCKS = [
    # ai-config style: 8-space indent
    ("        const authHeader = req.headers.get('authorization');\n"
     "        if (!authHeader?.startsWith('Bearer ')) {\n"
     "            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n"
     "        }\n\n"
     "        const admin = await checkAdmin(authHeader.split(' ')[1]);\n"
     "        if (!admin) {\n"
     "            return NextResponse.json({ error: 'Forbidden - Super Admin required' }, { status: 403 });\n"
     "        }",
     "        const authResult = await requireAdminUser(req);\n"
     "        if ('error' in authResult) return authResult.error;\n"
     "        const userId = authResult.user.id;"),
]

def do_migrate(content):
    original = content

    # Step 1: Add import
    content, _ = add_import(content)

    # Step 2: Try Pattern A replacements (exact string match — most reliable)
    content = content.replace(A_GET_AUTH_BLOCK, A_GET_REPLACEMENT)
    content = content.replace(A_PATCH_AUTH_BLOCK, A_PATCH_REPLACEMENT)
    content = content.replace(A_AICONFIG_AUTH_BLOCK, A_AICONFIG_REPLACEMENT)

    # Step 3: Pattern B replacements
    for old_block, new_block in PATTERN_B_BLOCKS:
        content = content.replace(old_block, new_block)

    # Step 4: Remove dead functions
    content = remove_dead_getUserFromToken(content)
    content = remove_dead_checkAdmin(content)

    # Step 5: Clean up double blank lines
    content = re.sub(r'\n\n\n+', '\n\n', content)

    return content != original, content

def get_files():
    files = []
    for root, dirs, filenames in os.walk(ADMIN_DIR):
        for fname in filenames:
            if fname.endswith('.ts') or 'route' in fname:
                fpath = os.path.join(root, fname)
                with open(fpath) as f:
                    c = f.read()
                if 'getUserFromToken' in c:
                    files.append(fpath)
    return sorted(files)

def main():
    files = get_files()
    print(f"Files to process: {len(files)}\n")

    migrated = 0
    errors = []
    still_have = []

    for fpath in files:
        rel = fpath.replace(BASE + '/', '')
        try:
            with open(fpath) as f:
                content = f.read()
            changed, new_content = do_migrate(content)
            if changed:
                with open(fpath, 'w') as f:
                    f.write(new_content)
                migrated += 1
                print(f"✅ {rel}")
            else:
                print(f"⚠️  {rel} (no change)")
        except Exception as e:
            errors.append(f"{rel}: {e}")
            print(f"❌ ERROR {rel}: {e}")

    print(f"\nMigrated {migrated}/{len(files)} files")
    if errors:
        print(f"Errors: {errors}")

    # Post-check
    print("\n--- Post-check: files still with getUserFromToken ---")
    for fpath in get_files():
        rel = fpath.replace(BASE + '/', '')
        print(f"  {rel}")

if __name__ == '__main__':
    main()
