import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Terminal, Copy, Check, Code2, BookOpen } from "lucide-react";

const sdkData = [
    {
        id: "python",
        name: "Python",
        install: "pip install promptrouter-sdk",
        example: `import openrouter_sdk
from openrouter_sdk.api import DefaultApi
from openrouter_sdk.models import PostApiV1ChatCompletionsRequest

# Initialize the client
client = DefaultApi()
client.api_client.configuration.api_key['Authorization'] = 'YOUR_API_KEY'

# Chat with a model
request = PostApiV1ChatCompletionsRequest(
    model="google/gemini-2.5-flash",
    messages=[{"role": "user", "content": "Hello!"}]
)

response = client.post_api_v1_chat_completions(request)
print(response.content)`,
        docs: "http://localhost:4000/swagger",
    },
    {
        id: "typescript",
        name: "TypeScript / JS",
        install: "npm install @promptrouter/sdk",
        example: `import { DefaultApi, Configuration } from '@promptrouter/sdk';

const config = new Configuration({
    apiKey: 'YOUR_API_KEY'
});

const api = new DefaultApi(config);

async function chat() {
    const response = await api.postApiV1ChatCompletions({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: 'Hello!' }]
    });
    console.log(response.content);
}`,
        docs: "http://localhost:4000/swagger",
    },
];

export function Sdks() {
    const [activeTab, setActiveTab] = useState("python");
    const [copiedInstall, setCopiedInstall] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    const activeSdk = sdkData.find(s => s.id === activeTab)!;

    const copyText = (text: string, setter: (v: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-[21px] font-[600] tracking-[-0.01em] m-0 mb-1">SDKs</h1>
                    <p className="m-0 text-[13px]" style={{ color: "var(--foreground-2)" }}>
                        Integrate PromptRouter using official, auto-generated SDKs.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {/* Left: language selector + resources */}
                <div className="flex flex-col gap-3">
                    {/* Language tabs */}
                    <div className="rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="px-[18px] py-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                            <h2 className="text-[14px] font-[600] m-0">Language</h2>
                        </div>
                        <div className="p-2 flex flex-col gap-1">
                            {sdkData.map(sdk => (
                                <button
                                    key={sdk.id}
                                    onClick={() => setActiveTab(sdk.id)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-left transition-all w-full"
                                    style={{
                                        background: activeTab === sdk.id ? "rgba(255,255,255,0.07)" : "transparent",
                                        color: activeTab === sdk.id ? "var(--foreground)" : "var(--foreground-2)",
                                    }}
                                    onMouseEnter={e => { if (activeTab !== sdk.id) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.045)"; }}
                                    onMouseLeave={e => { if (activeTab !== sdk.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                >
                                    <div
                                        className="size-7 rounded-[6px] flex items-center justify-center flex-none"
                                        style={{
                                            background: activeTab === sdk.id ? "rgba(62,99,221,0.14)" : "var(--surface-2)",
                                            border: `1px solid ${activeTab === sdk.id ? "rgba(62,99,221,0.25)" : "var(--border)"}`,
                                        }}
                                    >
                                        {sdk.id === "python" ? (
                                            <Terminal className="size-3.5" style={{ color: activeTab === sdk.id ? "#7C96EE" : "var(--foreground-3)" }} />
                                        ) : (
                                            <Code2 className="size-3.5" style={{ color: activeTab === sdk.id ? "#7C96EE" : "var(--foreground-3)" }} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-[13px] font-[500]">{sdk.name}</div>
                                        <div className="text-[11px]" style={{ color: "var(--foreground-3)" }}>Official SDK</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="px-[18px] py-[14px] flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
                            <BookOpen className="size-4" style={{ color: "var(--foreground-3)" }} />
                            <h2 className="text-[14px] font-[600] m-0">Resources</h2>
                        </div>
                        <div className="p-2">
                            {[
                                { label: "Interactive API Docs", href: "http://localhost:4000/swagger" },
                                { label: "API Keys", href: "/api-keys" },
                                { label: "Playground", href: "/playground" },
                            ].map(link => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    target={link.href.startsWith("http") ? "_blank" : undefined}
                                    rel="noreferrer"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] transition-colors no-underline"
                                    style={{ color: "var(--foreground-2)" }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.045)"; (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--foreground-2)"; }}
                                >
                                    <span className="size-[5px] rounded-full flex-none" style={{ background: "var(--accent-blue)" }} />
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: code panel */}
                <div className="col-span-2 flex flex-col gap-3">
                    {/* Install command */}
                    <div className="rounded-[10px] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-between px-[18px] py-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                            <h2 className="text-[14px] font-[600] m-0">Installation</h2>
                        </div>
                        <div className="px-[18px] py-[14px]">
                            <div
                                className="flex items-center gap-3 px-3 py-2.5 rounded-[8px]"
                                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                            >
                                <Terminal className="size-4 flex-none" style={{ color: "var(--foreground-3)" }} />
                                <code className="flex-1 text-[13px]" style={{ fontFamily: "var(--font-mono)", color: "#7C96EE" }}>
                                    {activeSdk.install}
                                </code>
                                <button
                                    onClick={() => copyText(activeSdk.install, setCopiedInstall)}
                                    className="size-7 flex items-center justify-center rounded-[6px] transition-colors"
                                    style={{ color: "var(--foreground-3)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    {copiedInstall ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Code example */}
                    <div className="rounded-[10px] overflow-hidden flex flex-col" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-between px-[18px] py-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                            <h2 className="text-[14px] font-[600] m-0">Quick start</h2>
                            <button
                                onClick={() => copyText(activeSdk.example, setCopiedCode)}
                                className="flex items-center gap-1.5 text-[12px] transition-colors"
                                style={{ color: "var(--foreground-3)" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground-2)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "var(--foreground-3)")}
                            >
                                {copiedCode ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                                {copiedCode ? "Copied!" : "Copy"}
                            </button>
                        </div>
                        <div
                            className="p-[18px] overflow-x-auto"
                            style={{ background: "#0A0A0B" }}
                        >
                            <pre
                                className="m-0 text-[12.5px] leading-[1.65]"
                                style={{ fontFamily: "var(--font-mono)", color: "#A1A1AA" }}
                            >
                                <code>{activeSdk.example}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
