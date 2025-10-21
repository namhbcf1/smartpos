$ErrorActionPreference = 'Stop'

$env:CLOUDFLARE_ACCOUNT_ID = '5b62d10947844251d23e0eac532531dd'
$env:CLOUDFLARE_D1_DATABASE_ID = '55344bf5-d142-4c0d-9e53-0ace4c41870c'
$env:CLOUDFLARE_API_TOKEN = 'wloKvK1hspK9po-H08B5EFQ7jWQVVGSk0MvOwcQj'

node scripts/import-cpu.js 'C:\Users\ADMIN\Desktop\new-master\js\data\cpu.js'