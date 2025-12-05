'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Loader2, Send, CheckCircle, Clock, AlertCircle, MessageSquare, ChevronLeft, User as UserIcon } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface Feedback {
    id: string;
    content: string;
    status: 'pending' | 'reviewed' | 'implemented';
    user_id: string | null;
    created_at: string;
    user_email?: string; // Optional: we might not have it easily without join, for now use ID
}

interface Reply {
    id: string;
    feedback_id: string;
    user_id: string | null;
    content: string;
    created_at: string;
}

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [session, setSession] = useState<Session | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [replies, selectedFeedback]);

    useEffect(() => {
        const init = async () => {
             const { data: { session } } = await supabase.auth.getSession();
             setSession(session);
             fetchFeedbacks();
        };
        init();
    }, []);

    // Real-time subscription for current chat
    useEffect(() => {
        if (selectedFeedback) {
            const channel = supabase
                .channel(`admin_feedback_chat:${selectedFeedback.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'feedback_replies',
                        filter: `feedback_id=eq.${selectedFeedback.id}`
                    },
                    (payload) => {
                        setReplies(prev => [...prev, payload.new as Reply]);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedFeedback]);

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('feedbacks')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setFeedbacks(data as Feedback[]);
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReplies = async (feedbackId: string) => {
        const { data } = await supabase
            .from('feedback_replies')
            .select('*')
            .eq('feedback_id', feedbackId)
            .order('created_at', { ascending: true });
        if (data) setReplies(data as Reply[]);
    };

    const handleSelectFeedback = async (feedback: Feedback) => {
        setSelectedFeedback(feedback);
        await fetchReplies(feedback.id);
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !session || !selectedFeedback) return;
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('feedback_replies')
                .insert([
                    { 
                        feedback_id: selectedFeedback.id, 
                        user_id: session.user.id, 
                        content: newMessage 
                    }
                ]);
            
            if (error) throw error;
            setNewMessage('');
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id: string, status: 'pending' | 'reviewed' | 'implemented') => {
        try {
            await supabase
                .from('feedbacks')
                .update({ status })
                .eq('id', id);
            
            setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f));
            if (selectedFeedback?.id === id) {
                setSelectedFeedback(prev => prev ? { ...prev, status } : null);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex h-[calc(100vh-4rem)] p-4 gap-4 bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Sidebar List */}
            <div className={`
                flex-shrink-0 w-full md:w-80 bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-200 dark:border-slate-700 flex flex-col
                ${selectedFeedback ? 'hidden md:flex' : 'flex'}
            `}>
                <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="font-bold text-lg">피드백 목록</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {feedbacks.map(feedback => (
                        <button
                            key={feedback.id}
                            onClick={() => handleSelectFeedback(feedback)}
                            className={`w-full text-left p-4 border-b border-gray-50 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50
                                ${selectedFeedback?.id === feedback.id ? 'bg-rose-50 dark:bg-rose-900/10' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`
                                    text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                                    ${feedback.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                      feedback.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 
                                      'bg-green-100 text-green-800'}
                                `}>
                                    {feedback.status}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {format(new Date(feedback.created_at), 'MM.dd HH:mm')}
                                </span>
                            </div>
                            <p className="text-sm font-medium line-clamp-2 text-gray-900 dark:text-gray-100">
                                {feedback.content}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 truncate">User: {feedback.user_id}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            {selectedFeedback ? (
                <div className={`
                    flex-1 bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-200 dark:border-slate-700 flex flex-col
                    ${selectedFeedback ? 'flex' : 'hidden md:flex'}
                `}>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setSelectedFeedback(null)} 
                                className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h3 className="font-bold">Feedback Details</h3>
                                <span className="text-xs text-gray-500">{selectedFeedback.id}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <select
                                value={selectedFeedback.status}
                                onChange={(e) => updateStatus(selectedFeedback.id, e.target.value as any)}
                                className="text-xs p-1 rounded border border-gray-200 dark:border-slate-600 bg-transparent"
                            >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="implemented">Implemented</option>
                            </select>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 dark:bg-slate-900/50">
                        {/* Original Feedback */}
                        <div className="flex justify-start">
                             <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center mr-2 flex-shrink-0">
                                <UserIcon className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl rounded-tl-none shadow-sm border border-gray-200 dark:border-slate-700 max-w-[80%]">
                                <p className="text-sm font-bold text-rose-500 mb-1">User Feedback</p>
                                <p className="whitespace-pre-wrap">{selectedFeedback.content}</p>
                                <span className="text-[10px] text-gray-400 block text-right mt-1">
                                    {format(new Date(selectedFeedback.created_at), 'yyyy-MM-dd HH:mm')}
                                </span>
                            </div>
                        </div>

                        {/* Replies */}
                        {replies.map(reply => {
                            // Can't easily distinguishing if reply is from admin or user based on ID alone without user profile in context,
                            // But for Admin View: If reply.user_id == current admin session user id -> Me (Right side).
                            // Else -> User (Left side).
                            const isMe = reply.user_id === session?.user?.id;
                            
                            return (
                                <div key={reply.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {!isMe && (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2 flex-shrink-0">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-300">U</span>
                                        </div>
                                    )}
                                    <div className={`
                                        rounded-xl p-3 max-w-[80%] shadow-sm text-sm
                                        ${isMe 
                                            ? 'bg-rose-500 text-white rounded-br-none' 
                                            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-slate-700'
                                        }
                                    `}>
                                        <p className="whitespace-pre-wrap">{reply.content}</p>
                                        <span className={`text-[10px] block text-right mt-1 ${isMe ? 'opacity-70' : 'text-gray-400'}`}>
                                            {format(new Date(reply.created_at), 'HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
                        <form onSubmit={handleSendReply} className="flex gap-2">
                             <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="답변 입력..."
                                className="flex-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                            <button 
                                type="submit"
                                disabled={!newMessage.trim() || submitting}
                                className="bg-rose-500 text-white p-2 rounded-lg hover:bg-rose-600 disabled:opacity-50 transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center text-gray-400 flex-col gap-4">
                    <MessageSquare className="w-16 h-16 opacity-20" />
                    <p>피드백을 선택하여 대화를 시작하세요.</p>
                </div>
            )}
        </div>
    );
}
