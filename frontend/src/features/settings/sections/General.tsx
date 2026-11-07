import { Activity, Brain, Moon, Monitor, Sun } from 'lucide-react';
import { Segmented, Toggle } from '../../../components/ui/Toggle';
import { useUiStore, type ThemePref, type ThinkingPref } from '../../../stores/useUiStore';
import { Group, Row } from '../parts';

export function General() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const thinking = useUiStore((s) => s.thinking);
  const setThinking = useUiStore((s) => s.setThinking);
  const telemetryAudio = useUiStore((s) => s.telemetryAudio ?? true);
  const setTelemetryAudio = useUiStore((s) => s.setTelemetryAudio);

  return (
    <>
      <Group title="视觉与交互基线">
        <Row
          title="界面主题 (Theme)"
          note="浅色高反差纯白图纸 (#FFFFFF) / 冷黑终端 (#121212) / 跟随系统"
        >
          <Segmented<ThemePref>
            label="主题"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: '浅色', icon: <Sun size={13} /> },
              { value: 'dark', label: '暗色', icon: <Moon size={13} /> },
              { value: 'system', label: '系统', icon: <Monitor size={13} /> },
            ]}
          />
        </Row>
        <Row
          title={
            <span className="flex items-center gap-1.5">
              <Brain size={14} />
              思考链默认状态 (Reasoning)
            </span>
          }
          note="控制排障过程中 Agent 的推理步骤默认展开折叠状态"
        >
          <Segmented<ThinkingPref>
            label="思考链"
            value={thinking}
            onChange={setThinking}
            options={[
              { value: 'expanded', label: '展开' },
              { value: 'collapsed', label: '折叠' },
              { value: 'hidden', label: '隐藏' },
            ]}
          />
        </Row>
      </Group>

      <Group title="工程遥测与感官反馈">
        <Row
          title={
            <span className="flex items-center gap-1.5">
              <Activity size={14} />
              BUS_LOAD 脉冲动效与微提示音
            </span>
          }
          note="开启顶栏实时系统总线遥测心跳律动动画与关键状态通知微音效"
        >
          <Toggle
            label="BUS_LOAD 遥测脉冲与微提示音"
            checked={telemetryAudio}
            onChange={setTelemetryAudio}
          />
        </Row>
      </Group>
    </>
  );
}
