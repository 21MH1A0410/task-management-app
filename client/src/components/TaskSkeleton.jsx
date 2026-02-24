import React from 'react';

const TaskSkeleton = () => {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100 animate-pulse h-full flex flex-col">
            <div className="mb-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
            </div>

            <div className="flex-grow mb-4">
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
                <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        </div>
    );
};

export default TaskSkeleton;
