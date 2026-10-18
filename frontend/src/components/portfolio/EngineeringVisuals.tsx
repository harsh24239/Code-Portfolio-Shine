import type { CSSProperties } from 'react';
import { Workflow, Database, Layers3, Code2, ShieldCheck, GitBranch, Server, Braces } from 'lucide-react';
import { type StudyKind } from './project-types';

const studies = {
  ai: {
    label: 'Agentic workflow', file: 'placement.workflow', icon: Workflow,
    steps: [
      { name: 'Interface', technology: 'React', detail: 'The web interface is the entry point to the placement preparation experience.' },
      { name: 'API', technology: 'FastAPI', detail: 'The backend exposes the application through Python APIs.' },
      { name: 'Orchestration', technology: 'LangGraph', detail: 'An agentic workflow coordinates the AI application.' },
      { name: 'Retrieval', technology: 'ChromaDB + Gemini', detail: 'Vector retrieval uses ChromaDB with Gemini embeddings to supply relevant context.' },
    ],
    code: ['React interface', '  → FastAPI', '  → LangGraph workflow', '  → RAG retrieval', '    ChromaDB · Gemini'],
  },
  database: {
    label: 'Credential verification', file: 'verification.architecture', icon: Database,
    steps: [
      { name: 'Interface', technology: 'React', detail: 'A React frontend provides the credential verification interface.' },
      { name: 'API', technology: 'Node.js + Express', detail: 'RESTful Express APIs connect the interface to the application backend.' },
      { name: 'Access', technology: 'RBAC', detail: 'Role-based access control governs access. The project also includes analytics dashboards and audit logs.' },
      { name: 'Storage', technology: 'MySQL', detail: 'A normalized MySQL schema stores the application data.' },
    ],
    code: ['React interface', '  → Express REST API', '  → Role-based access', '  → MySQL', '    Normalized schema'],
  },
  system: {
    label: 'Four-layer architecture', file: 'university.architecture', icon: Layers3,
    steps: [
      { name: 'UI', technology: 'Java Swing', detail: 'The Swing desktop interface presents the role-based ERP experience.' },
      { name: 'API', technology: 'Application boundary', detail: 'The API layer separates the interface from the rest of the application.' },
      { name: 'Service', technology: 'Business logic', detail: 'The service layer handles application logic. The project includes authentication and grade management.' },
      { name: 'DAO', technology: 'JDBC', detail: 'The data access layer isolates JDBC persistence from the application logic.' },
    ],
    code: ['UI       / Swing', 'API      / Application', 'Service  / Business logic', 'DAO      / JDBC', 'Tests    / JUnit'],
  },
};

/** Purpose-built architecture plates. All content is conceptual, not a product screenshot. */
export function ProjectVisual({ kind, icon }: { kind: StudyKind; icon: string }) {
  const study = studies[kind];
  const Icon = study.icon;
  return <div className={`project-artwork cinematic-artwork artwork-${kind}`} aria-hidden="true">
    <div className="showcase-coordinate"><span>{icon} / ENGINEERING STUDY</span><span>0{kind === 'ai' ? '1' : kind === 'database' ? '2' : '3'}</span></div>
    <div className="showcase-surface" data-art-panel>
      <div className="showcase-topbar"><Icon size={15} /><span>{study.file}</span><span className="showcase-topbar-mark">CONCEPT / {kind.toUpperCase()}</span></div>
      {kind === 'ai' ? <div className="ai-flow">
        <svg className="ai-connections" viewBox="0 0 1000 500" preserveAspectRatio="none" fill="none"><path d="M280 250H370M630 250H670V370H720M500 320V455H850V425"/><path className="ai-flow-signal" d="M280 250H370M630 250H670V370H720"/></svg>
        <span className="ai-flow-caption">A REQUEST BECOMES A WORKFLOW.</span>
        <div className="ai-module ai-entry"><span>01 / INTERFACE</span><Braces size={22}/><strong>React</strong><small>Placement preparation</small></div>
        <div className="ai-module ai-engine"><span>02 / ORCHESTRATION</span><GitBranch size={27}/><strong>LangGraph</strong><small>FastAPI · Agentic workflow</small><div className="ai-engine-ports"><i/><i/><i/><i/></div></div>
        <div className="ai-module ai-memory"><span>03 / RETRIEVAL</span><Database size={21}/><strong>ChromaDB</strong><small>Gemini embeddings</small></div>
        <span className="ai-context-label">RAG / CONTEXT RETRIEVAL</span>
      </div> : kind === 'database' ? <div className="schema-composition">
        <div className="schema-access"><ShieldCheck size={32}/><span>ROLE-BASED</span><strong>Access,<br/>by design.</strong><div><i/>RBAC authentication</div><div><i/>Audit logs</div></div>
        <div className="schema-table"><div className="schema-table-title"><Database size={15}/><span>MySQL</span><small>NORMALIZED</small></div>{[['React','Interface'],['Express','REST API'],['RBAC','Access control'],['Audit logs','Traceability']].map(([name,role],index)=><div className="schema-row" key={name}><span>0{index+1}</span><strong>{name}</strong><small>{role}</small><i/></div>)}<div className="schema-table-end">CREDENTIAL VERIFICATION / DATA LAYER</div></div>
      </div> : <div className="layer-composition">
        <div className="layer-axis"><span>SEPARATION<br/>OF CONCERNS</span><i/><small>04 LAYERS</small></div>
        {studies.system.steps.map((layer,index)=><div className="architecture-layer" key={layer.name} style={{'--layer':index} as CSSProperties}><span>0{index+1}</span><strong>{layer.name}</strong><small>{layer.technology}</small>{index===0?<Layers3 size={18}/>:index===3?<Database size={18}/>:<Server size={18}/>}</div>)}
        <div className="layer-footnote">JAVA / SWING / JDBC</div>
      </div>}
      <div className="showcase-status"><span><i/>ARCHITECTURE / CONCEPTUAL VIEW</span><Code2 size={13}/></div>
    </div>
  </div>;
}
