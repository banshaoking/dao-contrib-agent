import { useState, useEffect, useRef } from "react";

// Web3 & AI 新闻数据（模拟）
const newsData = [
  {
    id: 1,
    category: "AI",
    title: "OpenAI 发布 GPT-5.5，多模态能力大幅提升",
    summary: "新模型在代码生成、数学推理和视觉理解方面表现显著提升...",
    source: "TechCrunch",
    time: "2 小时前",
    icon: "🤖",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 2,
    category: "Web3",
    title: "Ethereum Dencun 升级成功，Gas 费用降低 90%",
    summary: "EIP-4844 Proto-Danksharding 实施后，L2 交易费用大幅下降...",
    source: "The Block",
    time: "3 小时前",
    icon: "⟠",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 3,
    category: "AI × Web3",
    title: "AI Agent 驱动的 DAO 治理成为新趋势",
    summary: "越来越多的 DAO 开始采用 AI Agent 自动执行治理决策...",
    source: "Decrypt",
    time: "4 小时前",
    icon: "🔗",
    color: "from-green-500 to-teal-500",
  },
  {
    id: 4,
    category: "AI",
    title: "小米 Mimo v2.5 Pro 发布，中文能力领先",
    summary: "小米最新大模型在中文理解和生成任务上超越 GPT-4...",
    source: "36氪",
    time: "5 小时前",
    icon: "📱",
    color: "from-orange-500 to-red-500",
  },
  {
    id: 5,
    category: "Web3",
    title: "Uniswap V4 即将上线，引入 Hooks 机制",
    summary: "新的 Hooks 系统允许开发者自定义 AMM 逻辑...",
    source: "CoinDesk",
    time: "6 小时前",
    icon: "🦄",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: 6,
    category: "AI × Web3",
    title: "Autonomous Agent 经济体规模突破 10 亿美元",
    summary: "AI Agent 自主进行链上交易和资产管理的总价值创新高...",
    source: "Forbes",
    time: "7 小时前",
    icon: "💰",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: 7,
    category: "AI",
    title: "Claude 4 Opus 发布，推理能力大幅提升",
    summary: "Anthropic 最新模型在复杂推理和代码生成任务上表现优异...",
    source: "VentureBeat",
    time: "8 小时前",
    icon: "🧠",
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: 8,
    category: "Web3",
    title: "Solana 生态 TVL 突破 100 亿美元",
    summary: "高性能公链 Solana 在 DeFi 和 NFT 领域持续增长...",
    source: "DeFi Llama",
    time: "9 小时前",
    icon: "☀️",
    color: "from-green-400 to-emerald-500",
  },
];

export default function NewsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 自动滚动
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % newsData.length);
      }, 4000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + newsData.length) % newsData.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % newsData.length);
  };

  // 获取当前显示的新闻（3条）
  const getVisibleNews = () => {
    const news = [];
    for (let i = 0; i < 3; i++) {
      news.push(newsData[(currentIndex + i) % newsData.length]);
    }
    return news;
  };

  const visibleNews = getVisibleNews();

  return (
    <div className="ios-card">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ios-orange to-ios-red flex items-center justify-center text-xl">
            📰
          </div>
          <div>
            <h2 className="text-xl font-bold">
              <span className="ios-gradient-text">Web3 & AI News</span>
            </h2>
            <p className="text-sm text-ios-gray">实时追踪行业动态</p>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="ios-btn ios-btn-secondary text-sm py-2 px-3"
          >
            {isPaused ? "▶️ 继续" : "⏸️ 暂停"}
          </button>
          <button onClick={handlePrev} className="ios-btn ios-btn-secondary text-sm py-2 px-3">
            ←
          </button>
          <button onClick={handleNext} className="ios-btn ios-btn-secondary text-sm py-2 px-3">
            →
          </button>
        </div>
      </div>

      {/* 新闻滚动区域 */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {visibleNews.map((news, index) => (
          <div
            key={news.id}
            className={`ios-card hover:scale-105 transition-all duration-300 cursor-pointer ${
              index === 0 ? "ring-2 ring-ios-blue/30" : ""
            }`}
          >
            {/* 分类标签 */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${news.color} flex items-center justify-center text-lg`}>
                {news.icon}
              </span>
              <span className="ios-badge ios-badge-blue">{news.category}</span>
              <span className="text-xs text-ios-gray ml-auto">{news.time}</span>
            </div>

            {/* 标题 */}
            <h3 className="font-semibold text-sm mb-2 line-clamp-2">
              {news.title}
            </h3>

            {/* 摘要 */}
            <p className="text-xs text-ios-gray mb-3 line-clamp-2">
              {news.summary}
            </p>

            {/* 来源 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-ios-gray">来源: {news.source}</span>
              <span className="text-xs text-ios-blue hover:underline">阅读更多 →</span>
            </div>
          </div>
        ))}
      </div>

      {/* 指示器 */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {newsData.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-ios-blue w-6"
                : "bg-ios-gray/30 hover:bg-ios-gray/50"
            }`}
          />
        ))}
      </div>

      {/* 实时更新提示 */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="w-2 h-2 bg-ios-green rounded-full animate-pulse"></span>
        <span className="text-xs text-ios-gray">实时更新中</span>
      </div>
    </div>
  );
}
