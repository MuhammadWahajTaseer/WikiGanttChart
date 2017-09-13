#!/usr/bin/perl
# -------------------------------------------
# Written by Corey Hunt, July 2017
#--------------------------------------------

use 5.010;
use warnings;
use strict;

use XML::LibXML;
use Data::Dumper;
use Time::Piece;
use Time::Seconds;
use List::Util qw(first max);
use Getopt::Long qw(:config no_auto_abbrev bundling);

my $defaultOutFile = "wikiGantt.xml";
my $dateFormat = "%Y-%m-%d";

my %captions = (
    "taskDates" => "Duration",
    "length" => "Duration",
    "advancement" => "Complete",
    "resources" => "Resource"
    );

my $help_string = <<EOF;

Description:
    Convert a GanttProject savefile to XML to be parsed by jsWikiGantt. 
    
Usage:
    perl convert_gantt.pl [options] <filename.gan> [outfile]

    If no outfile is specified, will output to $defaultOutFile by default.
    Will confirm before overwriting existing files.

    By default, the output XML will produce a chart including the same columns 
    as shown in GanttProject, as well as the same right-side task captions.
    Including any of the command-line switches which modify the display will disable 
    this default, and will require the user to specify any column he wishes to display, 
    as well as which caption type.


OPTIONS:

    -h
        Display this help and exit
    
    -a, --all
        Display all columns

    -r, --resource
        Show "Resource" column

    -d, --duration
        Show "Duration" column

    -c, --completion
        Show "% Complete" column

    -s, --start
        Show "Start Date" column

    -e, --end
        Show "End Date" column

    --caption=CAPTION
        Set caption for the right side of each task in the Gantt chart.
        Available options: None, Resource (default), Duration, Complete

    --skip-declaration
        Don't print XML declaration at the beginning of the file.  This will also disable
        pretty-printing, because of an oddity in the perl LibXML library

    --no-skip-declaration
        Include the XMl declaration at the beginning of the file. (default)

    --adjust-duration
        Adjust task duration to take weekends and holidays into account. (default)
        Enabling this option will ensure end dates match those from GanttProject,
        with the caveat that the "duration" column will now include non-working days
        Ex. In Gantt project, define a 2-day task starting on Friday.
        with --no-adjust-duration, this will produce a 2-day task ending on Saturday
        With --adjust-duration, this will produce a 4-day task ending on Monday

    --no-adjust-duration
        Do not take weekends and holidays into account.  Tasks' end dates will differ from
        those in in jsGantt, but the durations will be correct.
        Use of this option is discouraged, and will likely lead to undesired results.

Examples:
    Take test.gan as the input file, and output to $defaultOutFile by default.
    Use the same columns and right-side caption as displayed in GanttProject.
        perl convert_gantt.pl test.gan

    Display all available columns (there are less options than in GanttProject),
    and use the default caption (Resource).
        perl convert_gantt.pl  -a test.gan
        
    Display only the start and end date columns, and don't display a caption
        perl convert_gantt.pl -se --caption=None test.gan     

EOF



my $copy_display_options = 1;

# Variables for capturing command-line options
my $help = 0;
my $all = 0;
my $show_responsible = 0;
my $show_duration = 0;
my $show_percent_complete = 0;
my $show_start_date = 0;
my $show_end_date = 0;
my $caption_type = "";
my $adjust_duration = 1;

GetOptions(
            'help|h'            => \$help,
            'all|a'             => \$all,
            'resource|r'        => \$show_responsible,
            'duration|d'        => \$show_duration,
            'completion|c'      => \$show_percent_complete,
            'start|s'           => \$show_start_date,
            'end|e'             => \$show_end_date,
            'caption=s'         => \$caption_type,
            'skip-declaration!' => \$XML::LibXML::skipXMLDeclaration,
            'adjust-duration!'  => \$adjust_duration
           ) or say "$help_string" and exit;


# Display help -h flag is present, or wrong number of arguments
if ($help or @ARGV < 1 or @ARGV > 2) {
    say $help_string;
    exit;
}

my $inFileName = shift;
my $outFileName = shift;

if (not defined $outFileName) {
    $outFileName = $defaultOutFile;
}

# dom from GanttProject's savefile
my $projectDom = XML::LibXML->load_xml(
    no_blanks => 1,
    location => $inFileName
    );

# If the user has selected any of the display options, then use their options
# instead of copying the display from GanttProject
if (first {$_} ($all, $show_responsible, $show_duration, $show_percent_complete, 
            $show_start_date, $show_end_date, $caption_type)) {
    $copy_display_options = 0;
}

# If the caption is specified, but isn't a valid option
if ($caption_type ne "" and not grep { $caption_type eq $_ } values(%captions)) {
    say "Invalid caption type: $caption_type";
    say "Available options: None, Resource (default), Duration, Complete";
    exit;
}

# Show the same columns as shown in GanttProject
if ($copy_display_options) {
    my $resource_column = $projectDom->findnodes("//view/field[\@name='Resources']");
    $show_responsible = $resource_column ? 1 : 0;

    my $duration = $projectDom->findnodes("//view/field[\@name='Duration']");
    $show_duration = $resource_column ? 1 : 0;

    my $completion_column = $projectDom->findnodes("//view/field[\@name='Completion']");
    $show_percent_complete = $completion_column ? 1 : 0;
    
    my $start_column = $projectDom->findnodes("//view/field[\@name='Begin date']");
    $show_start_date = $start_column ? 1 : 0;

    my $end_column = $projectDom->findnodes("//view/field[\@name='End date']");
    $show_end_date = $end_column ? 1 : 0;

    # Set caption, according to Right caption (task details) in GanttProject
    my $caption = $projectDom->findvalue("//view/option[\@id='taskLabelRight']/\@value");
    if (defined $captions{$caption}) {
        $caption_type = $captions{$caption};
    }
    else {
        $caption_type = "None";
    }
}

if ( -e $outFileName ) {
    print "$outFileName already exists. Replace? (y/n): ";
    my $reply = <STDIN>;
    chomp $reply;
    if ($reply ne "y" and $reply ne "Y") {
        say "Aborting; please try running again with different filename";
        exit;
    }
}
open OUTFILE, ">$outFileName" or die "Couldn't open $outFileName";



# id => task DOM element
my %wikiTasks;
# List of hash refs {predecessor => id, successor => id}
my @dependancies;

my $wikiDom = XML::LibXML->createDocument();

# Set up the root element, and set attributes
my $jsgantt = $wikiDom->createElement("jsgantt");
$jsgantt->setAttribute("option-show-responsible", ($show_responsible or $all));
$jsgantt->setAttribute("option-show-duration", ($show_duration or $all));
$jsgantt->setAttribute("option-show-precent-complete", ($show_percent_complete or $all));
$jsgantt->setAttribute("option-show-start-date", ($show_start_date or $all));
$jsgantt->setAttribute("option-show-end-date", ($show_end_date or $all));
$jsgantt->setAttribute("option-caption-type", $caption_type);
$jsgantt->setAttribute("autolink", "0");
$wikiDom->setDocumentElement($jsgantt);

my @projectTasks = $projectDom->findnodes("//tasks/task");

# This function does most of the work
process_tasks( \@projectTasks, undef, "" );

# Adding dependancies and resources is easier after 
# we have done a first sweep of the tasks
add_dependancies( \%wikiTasks, \@dependancies );
add_resources( \%wikiTasks, $projectDom );

# jsWikiGantt breaks when a task ID is 0
# Incrementing all IDs avoids this issue
increment_IDs(%wikiTasks);

my $xml_string = $wikiDom->toString(1);
say "Writing to $outFileName";
print OUTFILE $xml_string;
close OUTFILE;



# This function is responsible for most of the conversion.
# Recursive nature allows for processing of child tasks, which are nested.
#
# $projectTasks is a libXML dom node
# $parentID is just that: the ID of the parent task. (should be undef for the first iteration)
# $parentNum is the outline number, excluding the current level
sub process_tasks {

    my ($projectTasks, $parentID, $parentNum) = @_;
    # Track numbering for this level only.  Will be appended to parentNum
    my $taskNum = 1;

    foreach my $projecttask ( @{ $projectTasks } ) {
        my $wikiTask = $wikiDom->createElement("task");
        $jsgantt->appendChild($wikiTask);
        
        # task ID
        my $id = $projecttask->findvalue('./@id');
        my $pID = $wikiDom->createElement("pID");
        $pID->appendText($id);
        $wikiTask->appendChild($pID);

        # Outline Number, Name & Notes
        # jsWikiGantt does not have columns for outline number or notes,
        # so include them as part of task name
        my $outlineNum;
        if ($parentNum ne "") {
            $outlineNum = join ".", $parentNum, $taskNum;
        }
        else {
            $outlineNum = $taskNum;
        }

        my $pName = $wikiDom->createElement("pName");
        my $name = $outlineNum . "  " . $projecttask->findvalue('./@name');

        my $note = $projecttask->findvalue('./notes/text()');
        if ($note ne "") {
            $name .= "  [Note: $note]";
        }

        # Remove quotes; the wiki plugin doesn't like them
        $name =~ s/['"]//g;         
        # same with newlines
        $name =~ s/\n/ /g;
        $pName->appendText($name);
        $wikiTask->appendChild($pName);

        #Start date
        my $pStart = $wikiDom->createElement("pStart");
        my $startStr = $projecttask->findvalue('./@start');
        $pStart->appendText($startStr);
        $wikiTask->appendChild($pStart);

        #End date
        my $start = Time::Piece->strptime($startStr, $dateFormat);
        my $duration =  $projecttask->findvalue('./@duration');
        if ($adjust_duration) {
            $duration = duration_with_offtime($start, $duration, $projectDom);
        }
        my $end = $start + (max($duration-1,0) * ONE_DAY);

        my $pEnd = $wikiDom->createElement("pEnd");
        $pEnd->appendText($end->strftime($dateFormat));
        $wikiTask->appendChild($pEnd);

        #Duration
        my $pDur = $wikiDom->createElement("pDur");
        $pDur->appendText($duration);
        $wikiTask->appendChild($pDur);

        #Color
        #Take the color from GanttProject, if one is specified
        my $pColor = $wikiDom->createElement("pColor");
        my $color = $projecttask->findvalue('./@color');
        $color =~ s/^#//;
        if ($color eq "") {
            $color = "8cb6ce";
        }
        $pColor->appendText($color);
        $wikiTask->appendChild($pColor);

        #Milestone
        my $pMile = $wikiDom->createElement("pMile");
        my $meeting = $projecttask->findvalue('./@meeting');
        my $mile = ($meeting eq "true") ? "1" : "0";
        $pMile->appendText($mile); 
        $wikiTask->appendChild($pMile);

        #Completion
        my $pComp = $wikiDom->createElement("pComp");
        $pComp->appendText($projecttask->findvalue('./@complete'));
        $wikiTask->appendChild($pComp);

        #Group (if this task is a summary task)
        my @childTasks = $projecttask->getChildrenByTagName("task");
        if (scalar @childTasks > 0) {
            my $pGroup = $projectDom->createElement("pGroup");
            $pGroup->appendText("1");
            $wikiTask->appendChild($pGroup);
        }

        #Parent (ID of parent task)
        if (defined $parentID) {
            my $pParent = $projectDom->createElement("pParent");
            $pParent->appendText($parentID);
            $wikiTask->appendChild($pParent);
        }

        # Gantt project stores each tasks's successor, 
        # but JSGantt asks for their predecessors
        # Add dependancies to array, to be dealt with later because 
        # it isn't guaranteed that the successor task (which we need to modify) 
        # has been created yet
        my @successors = $projecttask->getChildrenByTagName("depend");
        for my $successor (@successors) {
            my $successorID = $successor->findvalue('./@id');
            push @dependancies, {"predecessorID" => $id, "successorID" => $successorID};
        }

        # Add to the hash, for quick referencing later
        $wikiTasks{$id} = $wikiTask;

        $taskNum++;

        if ( scalar @childTasks ) {
            process_tasks( \@childTasks, $id, $outlineNum);
        }
    }
}

# Adding dependancies needs to be done after all of the wikiTasks have been created,
# because GanttProject stores the property in the predecessor, while jswikiGantt
# stores th property in the successor task
#
# $wikiTasks: hash reference { id => wikiTask dom }
sub add_dependancies {

    my ($wikiTasks, $dependancies) = @_;

    foreach my $dependancy (@$dependancies) {
        my $predecessorID = $dependancy->{"predecessorID"};
        my $successor = $wikiTasks->{ $dependancy->{"successorID"} };

        my ($pDepend) = $successor->findnodes("./pDepend");
        if (defined $pDepend) {
            my ($depText) = $pDepend->findnodes("./text()");
            my $wikiDepText = XML::LibXML::Text->new( $depText->toString . ", $predecessorID" );
            $depText->replaceNode($wikiDepText);
        }
        else {
            $pDepend = $projectDom->createElement("pDepend");
            $pDepend->appendText($predecessorID);
        }
        $successor->appendChild($pDepend);
    }
}

# Loop through the list of resource allocations, adding resources to each task
#
# $wikiTasks: hash reference. { id => wikiTask dom }
# $projectdom: GanttProject dom
sub add_resources {

    my ( $wikiTasks, $projectdom ) = @_;

    foreach my $allocation ($projectDom->findnodes("//allocations/allocation")) {
        my $taskID = $allocation->findvalue('./@task-id');
        my $wikiTask = $wikiTasks->{$taskID};

        my $resourceID = $allocation->findvalue('./@resource-id');
        my $resourceName = $projectDom->findvalue("//resource[\@id=$resourceID]/\@name");

        my ($pRes) = $wikiTask->findnodes("./pRes");
        if (defined $pRes) {
            my ($oldResText) = $pRes->findnodes("./text()");
            my $newResText = XML::LibXML::Text->new( $oldResText->toString . ", $resourceName" );
            $oldResText->replaceNode($newResText);
        }
        else {
            $pRes = $projectDom->createElement("pRes");
            $pRes->appendText($resourceName);
        }
        $wikiTask->appendChild($pRes);
    }
}

# Calculates the amount of days the task will take, if weekends and holidays are taken into account
#
# $startDate: a Time::Piece object
# $duration: in days
# $calendars: a libXML dom node
sub duration_with_offtime {

    my ($start, $duration, $dom) = @_;

    my %weekdays = (
        1 => 'sun',
        2 => 'mon',
        3 => 'tue',
        4 => 'wed',
        5 => 'thu',
        6 => 'fri',
        7 => 'sat'
    );

    # Compile list of Time::Piece objects representing holidays, for easy comparison later
    my @holidaysParsed;
    for my $date ($dom->findnodes("//calendars/date")) {
        my $dateString = join "-", 
                            $date->findvalue('./@year'), 
                            $date->findvalue('./@month'), 
                            $date->findvalue('./@date');

        my $dateParsed = Time::Piece->strptime($dateString, $dateFormat);
        push @holidaysParsed, $dateParsed;
    }

    my $cur = $start;

    # Walk through the task's schedule, possibly extending because of weekends/holidays
    # At the beginning of the loop, recalculate the end date, stopping when we reach it
    while ( $cur <= ($start + ($duration * ONE_DAY) - 1 ) ) {

        # If the current day is a non-working day (usually Sat and Sun),
        # extend the duration
        my $weekday = $weekdays{$cur->wday};
        if ($dom->findvalue("//default-week/\@$weekday")) {
            $duration += 1;
            # Avoid double-counting holidays and weekends
            next;
        }

        # If the current day is defined as a holiday, extend the duration
        if ( first { $cur == $_ } @holidaysParsed ) {
            $duration += 1;
        }

    } continue {
        $cur += ONE_DAY;
    }

    return $duration;
}

# jsWikiGantt breaks when pID=0
# Increment all the IDs to avoid this issue
sub increment_IDs {

    my %tasks = @_;

    for my $task (values %tasks) {
        # id
        my ($pID) = $task->findnodes("./pID/text()");
        my $curVal = $pID->data;
        $pID->setData($curVal+1);
        
        # parent
        my ($pParent) = $task->findnodes("./pParent/text()");
        if ($pParent) {
            $curVal = $pParent->data;
            $pParent->setData($curVal+1);
        }

        # dependencies
        my ($pDepend) = $task->findnodes("./pDepend/text()");
        if ($pDepend) {
            my @curVals = split ", ", $pDepend->data;
            my $wikiVal = join ", ", map( {$_ + 1} @curVals );
            $pDepend->setData($wikiVal);
        }
        
    }

}
