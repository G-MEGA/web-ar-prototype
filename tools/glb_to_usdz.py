"""
GLB -> USDZ 변환 (아이폰 AR 뷰어 Quick Look 용)

블렌더의 파이썬(bpy)으로 실행합니다. 블렌더가 설치돼 있다면:

  blender -b -P tools/glb_to_usdz.py -- 입력.glb 출력.usdz 높이(m) [애니메이션이름]

예) blender -b -P tools/glb_to_usdz.py -- assets/models/Robot.glb assets/models/Robot.usdz 0.2 Dance

- 모델을 지정한 높이(미터)로 맞추고, 바닥 중앙에 오도록 옮깁니다.
- 아이폰 AR 뷰어는 애니메이션을 하나만 자동 반복 재생하므로, 이름을 준 애니메이션 하나만 넣습니다.
  (이름을 생략하면 첫 번째 애니메이션)
"""
import sys
import bpy
import mathutils

argv = sys.argv[sys.argv.index('--') + 1:]
src, dst, height = argv[0], argv[1], float(argv[2])
clip = argv[3] if len(argv) > 3 else None

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
scene = bpy.context.scene

# glTF 가져오기가 만든 보조 오브젝트(뼈 모양 등) 지우기
helper = bpy.data.collections.get('glTF_not_exported')
if helper:
    for ob in list(helper.objects):
        bpy.data.objects.remove(ob, do_unlink=True)

# 뼈에 직접 붙은(bone parent) 메시는 USD로 내보낼 때 움직임이 사라지므로
# "뼈 하나에 100% 가중치로 스킨된 메시"로 바꿔 줍니다. (보이는 모습은 같음)
bone_children = [ob for ob in scene.objects
                 if ob.type == 'MESH' and ob.parent and ob.parent.type == 'ARMATURE' and ob.parent_type == 'BONE']
arms = {ob.parent for ob in bone_children}
for arm in arms:
    arm.data.pose_position = 'REST'   # 기본 자세에서 변환해야 위치가 맞음
bpy.context.view_layer.update()
for ob in bone_children:
    arm, bone = ob.parent, ob.parent_bone
    mw = ob.matrix_world.copy()
    ob.parent_type = 'OBJECT'
    ob.parent_bone = ''
    ob.matrix_parent_inverse = arm.matrix_world.inverted()
    ob.matrix_world = mw
    vg = ob.vertex_groups.new(name=bone)
    vg.add(range(len(ob.data.vertices)), 1.0, 'REPLACE')
    mod = ob.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm
for arm in arms:
    arm.data.pose_position = 'POSE'
bpy.context.view_layer.update()

# --- 애니메이션 하나 고르기 -------------------------------------------
actions = list(bpy.data.actions)
action = None
if actions:
    action = bpy.data.actions.get(clip) if clip else None
    if action is None:
        action = actions[0]
    for ob in scene.objects:
        ad = ob.animation_data
        if not ad:
            continue
        # glTF 가져오기가 만든 NLA 트랙을 끄고, 고른 애니메이션만 활성화
        for tr in list(ad.nla_tracks):
            ad.nla_tracks.remove(tr)
        if ob.type == 'ARMATURE':
            ad.action = action
            if hasattr(ad, 'action_slot') and action.slots:
                ad.action_slot = action.slots[0]
    f0, f1 = action.frame_range
    scene.frame_start, scene.frame_end = int(f0), int(f1)
    scene.frame_set(int(f0))
    bpy.context.view_layer.update()

# --- 크기/위치 맞추기 --------------------------------------------------
def world_bbox():
    dg = bpy.context.evaluated_depsgraph_get()
    mn = mathutils.Vector((1e9, 1e9, 1e9))
    mx = -mn
    for ob in scene.objects:
        if ob.type != 'MESH':
            continue
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        for v in me.vertices:
            w = ev.matrix_world @ v.co
            for i in range(3):
                mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
        ev.to_mesh_clear()
    return mn, mx

mn, mx = world_bbox()
s = height / max(mx.z - mn.z, 1e-6)

root = bpy.data.objects.new('ModelRoot', None)
scene.collection.objects.link(root)
for ob in list(scene.objects):
    if ob is not root and ob.parent is None:
        ob.parent = root
root.scale = (s, s, s)
root.location = (-(mn.x + mx.x) / 2 * s, -(mn.y + mx.y) / 2 * s, -mn.z * s)
bpy.context.view_layer.update()

# --- 내보내기 ----------------------------------------------------------
bpy.ops.wm.usd_export(
    filepath=dst,
    export_animation=action is not None,
    export_armatures=True,
    export_shapekeys=True,
    only_deform_bones=False,
    export_materials=True,
    generate_preview_surface=True,
    convert_orientation=True,
    export_global_forward_selection='Z',
    export_global_up_selection='Y',
    export_lights=False,
    export_cameras=False,
    usdz_downscale_size='1024',
)
print('OK', dst, 'scale', round(s, 4), 'clip', action.name if action else None)
