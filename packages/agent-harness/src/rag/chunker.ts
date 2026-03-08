import pino from 'pino';
import type { Chunk } from './vector_store.js';

const logger = pino({ name: 'chunker' });

// Types matching the Roblox Full-API-Dump.json structure
export interface ApiDump {
  Classes: ApiClass[];
  Enums: ApiEnum[];
  Version: number;
}

interface ApiClass {
  Name: string;
  Superclass: string;
  Members: ApiMember[];
  Tags?: string[];
  MemoryCategory?: string;
}

interface ApiMember {
  MemberType: 'Property' | 'Function' | 'Event' | 'Callback';
  Name: string;
  Tags?: string[];
  Security?: string | { Read?: string; Write?: string };
  ValueType?: ApiValueType;
  ReturnType?: ApiValueType;
  Parameters?: ApiParameter[];
  Category?: string;
}

interface ApiValueType {
  Name: string;
  Category?: string;
}

interface ApiParameter {
  Name: string;
  Type: ApiValueType;
  Default?: string;
}

interface ApiEnum {
  Name: string;
  Items: ApiEnumItem[];
}

interface ApiEnumItem {
  Name: string;
  Value: number;
}

// Known services in Roblox
const KNOWN_SERVICES = new Set([
  'Workspace', 'Players', 'Lighting', 'ReplicatedFirst', 'ReplicatedStorage',
  'ServerScriptService', 'ServerStorage', 'StarterGui', 'StarterPack',
  'StarterPlayer', 'Teams', 'SoundService', 'Chat', 'LocalizationService',
  'TestService', 'TweenService', 'UserInputService', 'RunService',
  'ContextActionService', 'MarketplaceService', 'DataStoreService',
  'MessagingService', 'TeleportService', 'PhysicsService', 'PathfindingService',
  'CollectionService', 'Debris', 'HttpService', 'InsertService',
  'GamePassService', 'BadgeService', 'TextService', 'GuiService',
  'PolicyService', 'GroupService', 'MemoryStoreService',
  'ProximityPromptService', 'MaterialService', 'AssetService',
  'AvatarEditorService', 'SocialService', 'VoiceChatService',
  'TextChatService', 'ExperienceNotificationService',
]);

function is_deprecated(tags?: string[]): boolean {
  return tags?.includes('Deprecated') ?? false;
}

function is_hidden(tags?: string[]): boolean {
  return (tags?.includes('NotBrowsable') ?? false) || (tags?.includes('Hidden') ?? false);
}

function format_value_type(vt?: ApiValueType): string {
  if (!vt) return 'void';
  return vt.Name;
}

function format_parameters(params?: ApiParameter[]): string {
  if (!params || params.length === 0) return '()';
  return '(' + params.map(p => {
    let s = `${p.Name}: ${format_value_type(p.Type)}`;
    if (p.Default !== undefined) s += ` = ${p.Default}`;
    return s;
  }).join(', ') + ')';
}

function format_member(m: ApiMember): string {
  if (is_deprecated(m.Tags) || is_hidden(m.Tags)) return '';

  switch (m.MemberType) {
    case 'Property':
      return `  Property ${m.Name}: ${format_value_type(m.ValueType)}`;
    case 'Function':
      return `  Function ${m.Name}${format_parameters(m.Parameters)}: ${format_value_type(m.ReturnType)}`;
    case 'Event':
      return `  Event ${m.Name}${format_parameters(m.Parameters)}`;
    case 'Callback':
      return `  Callback ${m.Name}${format_parameters(m.Parameters)}: ${format_value_type(m.ReturnType)}`;
    default:
      return '';
  }
}

/**
 * Break the Roblox API dump into semantic chunks for the knowledge base.
 */
export function chunk_api_dump(dump: ApiDump): Chunk[] {
  const chunks: Chunk[] = [];

  // --- Class chunks ---
  for (const cls of dump.Classes) {
    if (is_deprecated(cls.Tags) || is_hidden(cls.Tags)) continue;

    const is_service = KNOWN_SERVICES.has(cls.Name) || (cls.Tags?.includes('Service') ?? false);
    const members = cls.Members
      .map(format_member)
      .filter(s => s.length > 0);

    if (members.length === 0 && !is_service) continue;

    const properties = cls.Members.filter(m => m.MemberType === 'Property' && !is_deprecated(m.Tags) && !is_hidden(m.Tags));
    const methods = cls.Members.filter(m => m.MemberType === 'Function' && !is_deprecated(m.Tags) && !is_hidden(m.Tags));
    const events = cls.Members.filter(m => m.MemberType === 'Event' && !is_deprecated(m.Tags) && !is_hidden(m.Tags));

    const lines: string[] = [];
    lines.push(`# ${cls.Name}`);
    if (cls.Superclass && cls.Superclass !== '<<<ROOT>>>') {
      lines.push(`Inherits from: ${cls.Superclass}`);
    }
    if (cls.Tags && cls.Tags.length > 0) {
      lines.push(`Tags: ${cls.Tags.join(', ')}`);
    }
    lines.push('');

    if (properties.length > 0) {
      lines.push('## Properties');
      for (const p of properties) lines.push(format_member(p));
      lines.push('');
    }
    if (methods.length > 0) {
      lines.push('## Methods');
      for (const m of methods) lines.push(format_member(m));
      lines.push('');
    }
    if (events.length > 0) {
      lines.push('## Events');
      for (const e of events) lines.push(format_member(e));
      lines.push('');
    }

    const content = lines.join('\n');
    const category = is_service ? 'service' : 'class';

    const tags: string[] = [cls.Name.toLowerCase()];
    if (cls.Superclass && cls.Superclass !== '<<<ROOT>>>') {
      tags.push(cls.Superclass.toLowerCase());
    }
    if (is_service) tags.push('service');
    // Add member names as tags for better search
    for (const m of cls.Members) {
      if (!is_deprecated(m.Tags) && !is_hidden(m.Tags)) {
        tags.push(m.Name.toLowerCase());
      }
    }

    chunks.push({
      id: `api:${category}:${cls.Name}`,
      title: `${cls.Name} ${category === 'service' ? '(Service)' : '(Class)'}`,
      content,
      category,
      tags: tags.slice(0, 50), // Cap tags to keep index manageable
    });
  }

  // --- Enum chunks ---
  for (const en of dump.Enums) {
    const items = en.Items.map(item => `  ${item.Name} = ${item.Value}`).join('\n');
    const content = `# Enum: ${en.Name}\n\nValues:\n${items}`;

    chunks.push({
      id: `api:enum:${en.Name}`,
      title: `${en.Name} (Enum)`,
      content,
      category: 'enum',
      tags: [
        en.Name.toLowerCase(),
        'enum',
        ...en.Items.map(i => i.Name.toLowerCase()),
      ],
    });
  }

  logger.info({
    total: chunks.length,
    classes: chunks.filter(c => c.category === 'class').length,
    services: chunks.filter(c => c.category === 'service').length,
    enums: chunks.filter(c => c.category === 'enum').length,
  }, 'Chunked API dump');

  return chunks;
}
