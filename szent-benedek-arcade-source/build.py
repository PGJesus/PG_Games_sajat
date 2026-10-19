import os
D=os.path.dirname(os.path.abspath(__file__))
rd=lambda p: open(os.path.join(D,p),encoding='utf-8').read()
parts=["'use strict';\n// Szent Benedek Arcade: Packet Runner + Server Room Panic\nconst W = 1280, H = 720;\n",
 rd('src/_core_canvas.js'), rd('src/_core_audio.js'), rd('src/_core_input.js'), rd('src/_core_ui.js'),
 rd('src/sr_sim.js'), rd('src/packet.js'), rd('src/sr_game.js'), rd('src/launcher.js'),
 "\nApp.go('launcher');\nrequestAnimationFrame(mainFrame);\n"]
js='\n'.join(parts).replace('__LOGO_B64__', rd('logo_b64.txt').strip())
open(os.path.join(D,'game_all.js'),'w',encoding='utf-8').write(js)
html=f'''<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Szent Benedek Arcade</title>
<style>
  html,body{{margin:0;height:100%;background:#03050f;overflow:hidden}}
  body{{display:flex;align-items:center;justify-content:center}}
  canvas{{display:block}}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
{js}
</script>
</body>
</html>
'''
open(os.path.join(D,'szent-benedek-arcade.html'),'w',encoding='utf-8').write(html)
print('ok', len(html))
