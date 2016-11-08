//     mp3-parser test suite: ID3v2.3 tag / CHAP frame / ISO-8859-1 encoded subframes.
//     Tests run against id3v2.3-chap-iso-8859-1.mp3
//     (maintained with [Kid3 ID3 Tagger](http://kid3.sourceforge.net/))

//     https://github.com/biril/mp3-parser
//     Licensed and freely distributed under the MIT License
//     Copyright (c) 2013-2016 Alex Lambiris

/* jshint node:true, esversion:6 */
/* global jasmine, describe, beforeEach, it, expect */
"use strict";

var _ = require("underscore");
var util = require("../util");
var matchers = require("../matchers.js");

var mp3Parser = require("../../main.js");

var mp3FilePath = __dirname + "/../data/id3v2.3-chap-iso-8859-1.mp3";

describe("ID3v2.3 reader run on CHAP frames with with ISO-8859-1 encoded subframes", function () {
    // Read the ID3v2 tag. This is done once, here, and all tests run on `capturedId3v2Tag`
    var mp3FileView = util.dataViewFromFilePath(mp3FilePath);
    var capturedId3v2Tag = mp3Parser.readId3v2Tag(mp3FileView);

    // Helper to get (an array of) all captured ID3v2 tag frames of given `id`
    var getCapturedFrames = function (id) {
        return _(capturedId3v2Tag.frames).filter(function (frame) {
            return frame.header.id === id;
        });
    };

    // Expect that `numOfFrames` of `id` were captured. Returns an array of relevant
    //  captured frames - unless the `numOfFrames` expectation fails
    var expectCapturedFrames = function (id, numOfFrames) {
        var capturedFrames = getCapturedFrames(id);
        expect(capturedFrames.length).toBe(numOfFrames);
        return capturedFrames;
    };

    // [ID3v2 CHAP frames](http://id3.org/id3v2.3.0#Declared_ID3v2_frames) along with their
    //  'friendly names' as defined in the spec and, in certain cases, an `expected` hash which
    //  defines values to test against
    var id3v2TagFrames = {
        CHAP: {
            name: "Chapter",
            expected: {
                withoutFrames: {
                    id: "EmptyChapter",
                    startTime: 0,
                    endTime: 1000,
                    startOffset: 0,
                    endOffset: 65535,
                    frames: []
                },
                withFrames: {
                    id: "FullChapter",
                    startTime: 1000,
                    endTime: 2000,
                    startOffset: 65535,
                    endOffset: 4294967295,
                    frames: [{
                        header: {
                            id: "TIT2",
                            size: 6,
                            flagsOctet1: 0,
                            flagsOctet2: 0
                        },
                        name: "Title/songname/content description",
                        content: { encoding: 0, value: "Title" }
                    }, {
                        header: {
                            id: "COMM",
                            size: 19,
                            flagsOctet1: 0,
                            flagsOctet2: 0
                        },
                        name: "Comments",
                        content: {
                            encoding: 0,
                            language: "eng",
                            description: "Comment",
                            text: "Comment"
                        }
                    }]
                }
            }
        }
    };

    beforeEach(function () { jasmine.addMatchers(matchers); });

    it("should read CHAP: Chapters frame", function () {
        var capturedFrames = expectCapturedFrames("CHAP", 2);

        // Get expected and actual chapter frames, for the case of an empty chapter frame
        var expectedEmptyChapter = id3v2TagFrames.CHAP.expected.withoutFrames;
        var framesWithoutNestedFrames = _.filter(capturedFrames, function (frame) {
            return frame.content.id === expectedEmptyChapter.id;
        });

        // Get expected and actual chapter frames, for the case of an empty chapter frame
        var expectedChapterWithFrames = id3v2TagFrames.CHAP.expected.withFrames;
        var framesWithNestedFrames = _.filter(capturedFrames, function (frame) {
            return frame.content.id === expectedChapterWithFrames.id;
        });

        expect(framesWithoutNestedFrames.length).toBe(1);
        var emptyChapter = framesWithoutNestedFrames[0];
        expect(emptyChapter.content.startTime).toBe(expectedEmptyChapter.startTime);
        expect(emptyChapter.content.endTime).toBe(expectedEmptyChapter.endTime);
        expect(emptyChapter.content.startOffset).toBe(expectedEmptyChapter.startOffset);
        expect(emptyChapter.content.endOffset).toBe(expectedEmptyChapter.endOffset);
        expect(emptyChapter.content.frames.length).toBe(expectedEmptyChapter.frames.length);

        expect(framesWithNestedFrames.length).toBe(1);
        var chapterWithFrames = framesWithNestedFrames[0];
        expect(chapterWithFrames.content.startTime).toBe(expectedChapterWithFrames.startTime);
        expect(chapterWithFrames.content.endTime).toBe(expectedChapterWithFrames.endTime);
        expect(chapterWithFrames.content.startOffset).toBe(expectedChapterWithFrames.startOffset);
        expect(chapterWithFrames.content.endOffset).toBe(expectedChapterWithFrames.endOffset);
        var chapterSubFrames = chapterWithFrames.content.frames;
        expect(chapterSubFrames.length).toBe(expectedChapterWithFrames.frames.length);
        var titleFrames = chapterSubFrames.filter(function (frame) {
            return frame.header.id === "TIT2";
        });
        expect(titleFrames.length).toBe(1);
        var titleFrame = titleFrames[0];
        expect(titleFrame.content.name).toBe(expectedChapterWithFrames.frames[0].content.name);
        var commentFrames = chapterWithFrames.content.frames.filter(function (frame) {
            return frame.header.id === "COMM";
        });
        expect(commentFrames.length).toBe(1);
        var commentFrame = commentFrames[0];
        expect(commentFrame.content.name).toBe(expectedChapterWithFrames.frames[1].content.name);
    });
});
