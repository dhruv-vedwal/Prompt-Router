import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    Terminal,
    Copy,
    Check,
    Code2,
    BookOpen,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const sdkData = [
    {
        id: "python",
        name: "Python",
        icon: Terminal,
        install: "pip install promptrouter-sdk",
        example: `import openrouter_sdk
from openrouter_sdk.api import DefaultApi
from openrouter_sdk.models import PostApiV1ChatCompletionsRequest

# Initialize the client
client = DefaultApi()
client.api_client.configuration.api_key['Authorization'] = 'YOUR_API_KEY'

# Chat with a model
request = PostApiV1ChatCompletionsRequest(
    model="openai/gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)

response = client.post_api_v1_chat_completions(request)
print(response.content)`,
        docs: "#"
    },
    {
        id: "typescript",
        name: "TypeScript / JS",
        icon: Code2,
        install: "npm install @promptrouter/sdk",
        example: `import { DefaultApi, Configuration } from '@promptrouter/sdk';

const config = new Configuration({
    apiKey: 'YOUR_API_KEY'
});

const api = new DefaultApi(config);

async function chat() {
    const response = await api.postApiV1ChatCompletions({
        model: 'openai/gpt-4',
        messages: [{ role: 'user', content: 'Hello!' }]
    });
    
    console.log(response.content);
}`,
        docs: "#"
    }
];

export function Sdks() {
    const [activeTab, setActiveTab] = useState("python");
    const [copied, setCopied] = useState(false);

    const activeSdk = sdkData.find(s => s.id === activeTab)!;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Developer Portal
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Integrate PromptRouter into your applications using our official,
                        auto-generated SDKs. Built for performance and type-safety.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Select Language */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-2">
                            Choose Language
                        </h3>
                        <div className="space-y-2">
                            {sdkData.map((sdk) => (
                                <button
                                    key={sdk.id}
                                    onClick={() => setActiveTab(sdk.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group relative overflow-hidden",
                                        activeTab === sdk.id
                                            ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30 shadow-lg shadow-primary/10"
                                            : "bg-card/40 border-border/50 hover:border-border hover:bg-card/60"
                                    )}
                                >
                                    {activeTab === sdk.id && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                                    )}
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={cn(
                                            "p-2.5 rounded-lg transition-all duration-300",
                                            activeTab === sdk.id 
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                                : "bg-muted/50 text-muted-foreground group-hover:text-foreground group-hover:bg-muted"
                                        )}>
                                            <sdk.icon className="size-5" />
                                        </div>
                                        <div>
                                            <div className={cn(
                                                "font-bold transition-colors text-base",
                                                activeTab === sdk.id ? "text-foreground" : "text-foreground/60 group-hover:text-foreground/90"
                                            )}>
                                                {sdk.name}
                                            </div>
                                            <div className={cn(
                                                "text-xs transition-colors",
                                                activeTab === sdk.id ? "text-foreground/70" : "text-muted-foreground"
                                            )}>Official SDK</div>
                                        </div>
                                    </div>
                                    <ArrowRight className={cn(
                                        "size-4 transition-all duration-300",
                                        activeTab === sdk.id ? "translate-x-0 opacity-100 text-primary" : "-translate-x-2 opacity-0"
                                    )} />
                                </button>
                            ))}
                        </div>

                        {/* Resources */}
                        <div className="p-6 rounded-2xl bg-card/40 border border-border/50 space-y-5 mt-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                            <h4 className="font-bold flex items-center gap-2 text-foreground relative z-10">
                                <BookOpen className="size-4 text-primary" />
                                Resources
                            </h4>
                            <ul className="space-y-4 text-sm relative z-10">
                                <li>
                                    <a href="http://localhost:4000/swagger" target="_blank" rel="noreferrer" className="text-foreground/70 hover:text-primary transition-all flex items-center gap-3 group/link">
                                        <div className="size-1.5 rounded-full bg-primary/40 group-hover/link:bg-primary group-hover/link:scale-125 transition-all shadow-primary/40" />
                                        <span className="font-medium">Interactive API Docs</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="/api-keys" className="text-foreground/70 hover:text-primary transition-all flex items-center gap-3 group/link">
                                        <div className="size-1.5 rounded-full bg-primary/40 group-hover/link:bg-primary group-hover/link:scale-125 transition-all shadow-primary/40" />
                                        <span className="font-medium">Auth Specification</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Code & Installation */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Installation */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground">Installation</h3>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Terminal className="size-4 text-muted-foreground" />
                                </div>
                                <input
                                    readOnly
                                    value={activeSdk.install}
                                    className="w-full bg-card/50 border border-border/50 rounded-xl py-3 pl-11 pr-12 text-sm font-mono text-primary outline-none focus:border-primary/30 transition-all"
                                />
                                <button
                                    onClick={() => copyToClipboard(activeSdk.install)}
                                    className="absolute right-2 top-1.5 p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                                >
                                    {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Quick Start Code */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-muted-foreground">Quick Start Example</h3>
                                <button
                                    onClick={() => copyToClipboard(activeSdk.example)}
                                    className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <Copy className="size-3" />
                                    Copy Code
                                </button>
                            </div>
                            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-[#0d0d0d] p-6 shadow-2xl">
                                <pre className="text-sm font-mono text-zinc-300 overflow-x-auto">
                                    <code>{activeSdk.example}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
