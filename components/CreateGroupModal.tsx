'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function CreateGroupModal({ isOpen, onClose, onCreated }: CreateGroupModalProps) {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const generateCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('로그인이 필요합니다');
                return;
            }

            const code = generateCode();

            // 1. Create Group
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name: name.trim(),
                    code: code,
                    leader_id: user.id,
                })
                .select()
                .single();

            if (groupError) throw groupError;

            // 2. Add Leader as Member
            const { error: memberError } = await supabase
                .from('group_members')
                .insert({
                    group_id: groupData.id,
                    user_id: user.id,
                });

            if (memberError) {
                // Rollback (delete group) if member addition fails
                await supabase.from('groups').delete().eq('id', groupData.id);
                throw memberError;
            }

            toast.success('그룹이 생성되었습니다!');
            setName('');
            onCreated();
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            toast.error('그룹 생성에 실패했습니다');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">새 그룹 만들기</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                그룹 이름
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="예: 아침형 인간 🌞"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={!name.trim() || isSubmitting}
                                className="px-5 py-2.5 bg-rose-500 text-white rounded-xl font-bold shadow-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                            >
                                {isSubmitting ? '생성 중...' : '그룹 만들기'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
