#!/usr/bin/env python3
"""Test in a disposable local MySQL8 container; no staging or production connection."""
import argparse
import os
from pathlib import Path
import subprocess
import time
import uuid
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--node-modules', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
deps = args.node_modules or root / 'rateyourdj-backend/node_modules'
if not (deps / 'mysql2').is_dir():
    raise SystemExit('Install backend dependencies or pass --node-modules PATH')
name = 'rateyourdj-content-test-' + uuid.uuid4().hex[:8]
def run(argv, **kwargs):
    result = subprocess.run(argv, capture_output=True, **kwargs)
    if result.returncode:
        raise RuntimeError(result.stderr.decode() if isinstance(result.stderr, bytes) else result.stderr)
    return result.stdout
run(['docker', 'run', '-d', '--rm', '--name', name, '-e', 'MYSQL_ALLOW_EMPTY_PASSWORD=yes', '-e', 'MYSQL_DATABASE=rateyourdj', '-p', '127.0.0.1::3306', 'mysql:8.0'])
try:
    for attempt in range(100):
        ready = subprocess.run(['docker','exec',name,'mysql','--protocol=TCP','-h127.0.0.1','-uroot','rateyourdj','-e','SELECT 1'], capture_output=True)
        if ready.returncode == 0:
            break
        time.sleep(0.3)
    else:
        raise RuntimeError('Local MySQL not ready')
    def sql(source):
        run(['docker','exec','-i',name,'mysql','--default-character-set=utf8mb4','-uroot','rateyourdj'], input=source)
    files = ['database.sql','migrations/006_dj_status.sql','migrations/007_add_bio.sql','migrations/008_dj_edit_requests.sql','migrations/001_add_comments.sql','migrations/010_comment_status.sql','migrations/011_soft_delete_users.sql','migrations/014_moderation_feedback.sql','migrations/012_add_name_initial.sql']
    for file in files:
        sql((root/'rateyourdj-backend'/file).read_bytes())
    sql("INSERT INTO djs(id,name,city,status) VALUES(9,'LIUYANG刘炀','北京市','approved'); ALTER TABLE users ADD COLUMN access_level ENUM('waitlist','full','banned') DEFAULT 'full';".encode())
    migration = (root/'rateyourdj-backend/migrations/016_dj_content_tools.sql').read_bytes()
    sql(migration)
    sql(migration)
    print('PASS migration016 applies and reruns on MySQL8', flush=True)
    port = run(['docker','port',name,'3306'], text=True).strip().split(':')[-1]
    env = {**os.environ, 'NODE_PATH': str(deps.resolve()), 'RATEYOURDJ_LOCAL_FIXTURE':'1','DB_HOST':'127.0.0.1','DB_PORT':port,'DB_USER':'root','DB_PASSWORD':'','DB_NAME':'rateyourdj','JWT_SECRET':'local-disposable-fixture','NODE_ENV':'test'}
    # Explicit loopback settings override inherited DB environment variables.
    result = subprocess.run(['node','tests/dj-content.mysql.cjs'], cwd=root, env=env, text=True, capture_output=True)
    print(result.stdout, end='')
    if result.returncode:
        print(result.stderr)
        raise SystemExit(result.returncode)
finally:
    subprocess.run(['docker','stop',name], capture_output=True)
