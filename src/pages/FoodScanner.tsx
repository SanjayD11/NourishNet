import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    HeartPulse, Loader2, AlertTriangle, CheckCircle2, XCircle,
    Trash2, Flame, Droplets, TrendingUp, Sparkles, Info, Utensils
} from 'lucide-react';
import SmartImageCapture from '@/components/SmartImageCapture';
import { analyzeHealthRisk, type HealthAdvisorResult } from '@/utils/healthAdvisorApi';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/providers/LanguageProvider';

interface ImageData {
    file: File;
    preview: string;
    source: 'camera' | 'upload';
}

interface AnalysisItem {
    imagePreview: string;
    fileName: string;
    result: HealthAdvisorResult | null;
    error: string | null;
    analyzing: boolean;
}

const riskColors = {
    LOW: {
        icon: <CheckCircle2 className="w-5 h-5" />,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        ring: 'ring-green-500/20',
        gradient: 'from-green-500/20 to-green-500/5',
        label: 'Low',
        dot: 'bg-green-500',
    },
    MODERATE: {
        icon: <AlertTriangle className="w-5 h-5" />,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        ring: 'ring-amber-500/20',
        gradient: 'from-amber-500/20 to-amber-500/5',
        label: 'Moderate',
        dot: 'bg-amber-500',
    },
    HIGH: {
        icon: <XCircle className="w-5 h-5" />,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        ring: 'ring-red-500/20',
        gradient: 'from-red-500/20 to-red-500/5',
        label: 'High',
        dot: 'bg-red-500',
    },
};

export default function FoodScanner() {
    const [images, setImages] = useState<ImageData[]>([]);
    const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
    const { t } = useLanguage();
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyzeAll = async () => {
        if (images.length === 0) {
            toast({
                title: 'No images',
                description: 'Please upload at least one food image to analyze.',
                variant: 'destructive',
            });
            return;
        }

        setIsAnalyzing(true);

        const initialItems: AnalysisItem[] = images.map((img) => ({
            imagePreview: img.preview,
            fileName: img.file.name,
            result: null,
            error: null,
            analyzing: true,
        }));
        setAnalyses(initialItems);

        const updatedItems = [...initialItems];

        for (let i = 0; i < images.length; i++) {
            try {
                const result = await analyzeHealthRisk(images[i].file);
                updatedItems[i] = { ...updatedItems[i], result, analyzing: false };
            } catch (err: any) {
                updatedItems[i] = {
                    ...updatedItems[i],
                    error: err.message || 'Analysis failed',
                    analyzing: false,
                };
            }
            setAnalyses([...updatedItems]);
        }

        setIsAnalyzing(false);

        const successCount = updatedItems.filter((r) => r.result).length;
        toast({
            title: 'Analysis Complete',
            description: `Analyzed ${successCount}/${images.length} image${images.length > 1 ? 's' : ''} successfully.`,
        });
    };

    const clearAll = () => {
        setImages([]);
        setAnalyses([]);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="glass-card p-6 sm:p-8">
                <div className="text-center mb-2">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full mb-4 shadow-lg shadow-rose-500/25"
                    >
                        <HeartPulse className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {t('healthAdvisor.title')}
                    </h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        {t('healthAdvisor.desc')}
                    </p>
                </div>
            </div>

            {/* Upload Card */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-primary" />
                        {t('healthAdvisor.upload')}
                    </CardTitle>
                    <CardDescription>
                        {t('healthAdvisor.uploadDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <SmartImageCapture
                        images={images}
                        onImagesChange={setImages}
                        maxImages={3}
                        maxSizeMB={5}
                        maxResolution={1920}
                        emptyStateText="Upload clear photos of your food for AI health analysis"
                        tipText="Tip: Well-lit photos allow the AI to accurately identify ingredients and measure health risks."
                    />

                    <div className="flex gap-3">
                        <Button
                            onClick={handleAnalyzeAll}
                            disabled={images.length === 0 || isAnalyzing}
                            className="flex-1 gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                            size="lg"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('healthAdvisor.analyzing')}
                                </>
                            ) : (
                                <>
                                    <HeartPulse className="w-4 h-4" />
                                    {t('healthAdvisor.analyze')}
                                </>
                            )}
                        </Button>

                        {(images.length > 0 || analyses.length > 0) && (
                            <Button variant="outline" onClick={clearAll} disabled={isAnalyzing} size="lg">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            <AnimatePresence>
                {analyses.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="space-y-6"
                    >
                        <h2 className="text-xl font-semibold text-foreground px-1 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            {t('healthAdvisor.results')}
                        </h2>

                        {analyses.map((item, index) => {
                            const r = item.result;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="space-y-4"
                                >
                                    {/* Image + Food Info Header */}
                                    <Card className="glass-card overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="sm:w-40 sm:min-h-[160px] bg-muted/50 flex-shrink-0">
                                                    <img
                                                        src={item.imagePreview}
                                                        alt={item.fileName}
                                                        className="w-full h-44 sm:h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 p-5 space-y-3">
                                                    {/* Analyzing */}
                                                    {item.analyzing && (
                                                        <div className="flex items-center gap-3 py-8">
                                                            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                                                            <div>
                                                                <p className="font-medium text-foreground">{t('healthAdvisor.analyzingRisks')}</p>
                                                                <p className="text-sm text-muted-foreground">{t('healthAdvisor.aiEvaluating')}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Error */}
                                                    {item.error && (
                                                        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/25">
                                                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                            <span className="text-sm text-red-400">{item.error}</span>
                                                        </div>
                                                    )}

                                                    {/* Food header with calories */}
                                                            {r && (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                                        <div>
                                                                            <h3 className="text-xl font-bold text-foreground">{r.food_name}</h3>
                                                                            <p className="text-sm text-muted-foreground">{r.serving_size}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-3 py-1.5 text-base font-bold gap-1.5 shadow-sm">
                                                                                <Flame className="w-4 h-4" />
                                                                                {r.estimated_calories} cal
                                                                            </Badge>
                                                                        </div>
                                                                    </div>

                                                                    {/* Macronutrients */}
                                                                    <div className="flex items-center gap-3 flex-wrap">
                                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                            Protein: {r.macros.protein}g
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                            Carbs: {r.macros.carbs}g
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                            Fats: {r.macros.fats}g
                                                                        </div>
                                                                    </div>

                                                                    {/* Allergens */}
                                                                    {r.allergens && r.allergens.length > 0 && (
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-1">Allergens:</span>
                                                                            {r.allergens.map((allergen, idx) => (
                                                                                <Badge key={idx} variant="destructive" className="text-[9px] uppercase px-2 py-0 h-4 bg-red-500/80">
                                                                                    {allergen}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {r.nutrients_summary && (
                                                                        <p className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2 italic border border-muted/20">
                                                                            🥗 {r.nutrients_summary}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* 4 Health Risk Cards */}
                                    {r && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Card 1: Diabetic Risk */}
                                            <HealthRiskCard
                                                title={t('healthAdvisor.diabeticRisk')}
                                                icon={<Droplets className="w-5 h-5" />}
                                                level={r.diabetic_risk.level}
                                                reason={r.diabetic_risk.reason}
                                                index={0}
                                                t={t}
                                            />

                                            {/* Card 2: Cholesterol Impact */}
                                            <HealthRiskCard
                                                title={t('healthAdvisor.cholesterolImpact')}
                                                icon={<HeartPulse className="w-5 h-5" />}
                                                level={r.cholesterol_impact.level}
                                                reason={r.cholesterol_impact.reason}
                                                index={1}
                                                t={t}
                                            />

                                            {/* Card 3: Weight Gain % */}
                                            <HealthRiskCard
                                                title={t('healthAdvisor.weightGain')}
                                                icon={<TrendingUp className="w-5 h-5" />}
                                                level={r.weight_gain_potential.level}
                                                reason={r.weight_gain_potential.reason}
                                                percentage={r.weight_gain_potential.percentage}
                                                index={2}
                                                t={t}
                                            />

                                            {/* Card 4: AI Suggestion */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 + 0.1 }}
                                            >
                                                <Card className="glass-card h-full border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
                                                    <CardContent className="p-4 space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                                <Sparkles className="w-5 h-5" />
                                                            </div>
                                                            <h4 className="font-semibold text-foreground">{t('healthAdvisor.aiSuggestion')}</h4>
                                                        </div>
                                                        <p className="text-sm text-foreground/80 leading-relaxed">
                                                            {r.ai_suggestion}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Disclaimer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-xs text-muted-foreground px-4 pb-6"
            >
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{t('healthAdvisor.disclaimer')}</span>
            </motion.div>
        </motion.div>
    );
}

/* ─── Health Risk Card Component ─── */
function HealthRiskCard({
    title, icon, level, reason, percentage, index = 0, t,
}: {
    title: string;
    icon: React.ReactNode;
    level: "LOW" | "MODERATE" | "HIGH";
    reason: string;
    percentage?: number;
    index?: number;
    t: any;
}) {
    const config = riskColors[level];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
        >
            <Card className={`glass-card h-full ${config.border} bg-gradient-to-br ${config.gradient} ring-1 ${config.ring}`}>
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center ${config.color}`}>
                                {icon}
                            </div>
                            <h4 className="font-semibold text-foreground text-sm">{title}</h4>
                        </div>
                        <Badge
                            variant="outline"
                            className={`${config.bg} ${config.color} ${config.border} border gap-1.5 px-2.5 py-0.5 font-semibold`}
                        >
                            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                            {config.label}
                        </Badge>
                    </div>

                    {/* Percentage bar (for weight gain) */}
                    {percentage !== undefined && (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{t('healthAdvisor.likelihood') || 'Likelihood'}</span>
                                <span className={`font-bold ${config.color}`}>{percentage}%</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${config.dot}`}
                                />
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
