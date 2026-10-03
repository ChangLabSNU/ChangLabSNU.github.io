---
title: "Research"
layout: textlay
excerpt: "How we design mRNA medicines on evidence from our own experiments, and read RNA one molecule at a time with nanopore sequencing."
permalink: /research/
---

# Research

We want to know how genes are regulated. Most of all, we are drawn to what
happens after transcription, when RNA-binding proteins settle what becomes
of each mRNA. It is hard to watch, so we build the methods to see it:
high-throughput biochemistry and sequencing that take in the whole
transcriptome at once. Looking at every gene lets the data show us rules we
did not know to look for. The rules for reading an mRNA are also the rules
for writing one, and we use them to design mRNA vaccines and therapeutics.

## Designing mRNA Medicines

A single protein can be written as more than 10<sup>600</sup> different
mRNA sequences, far more than there are atoms in the universe, because most
amino acids have several synonymous codons. Only some of those sequences
make a good medicine.

And a vaccine mRNA gets one chance. The cell keeps transcribing its own
mRNAs, but the one we deliver cannot be replaced once it is gone, so how
long it survives and how efficiently it is read decide how much protein it
makes.

{% picture figure-wide images/research/sars-cov-2-codons.jpg alt="" class="qb-fig-wide" %}

Finding the right sequence starts at the bench. We measure what really
happens to mRNAs in cells, turn those measurements into the rules our
algorithms follow, and send the sequences they design back to the bench to
be tested.

**Testing the rules.** Design tools optimize features that are believed to
matter. Which ones really do is still an open question. We answer it in
cells, measuring thousands of sequence variants side by side to see what
changes how long an mRNA lasts and how much protein it makes.

**Design algorithms.** The answers go into software that has to search
that astronomical space well. It weighs every shape an RNA can fold into
and protects the regulatory elements in the untranslated regions at either
end. It is also fast: running on parallel cloud computers, it can keep
pace with an outbreak response such as [CEPI's 100 Days
Mission](https://cepi.net/cepi-20-and-100-days-mission). Our open-source
tool [VaxPress](https://github.com/ChangLabSNU/VaxPress) and our newer
design engine, Ribogami, work this way today. Next, GARFold moves RNA
folding onto GPUs, and a differentiable version of the calculation lets us
work backward from the structure we want to a sequence that forms it.

**Beyond vaccines.** Vaccines against infectious disease were just the
first mRNA medicines. mRNA is now expanding into rare diseases and cancer,
where it may replace a protein a patient's body cannot make, teach the
immune system to recognize a tumor, or turn a patient's own T cells into
CAR-T cells. Each of these asks something different of the sequence, and
the difference can decide whether the medicine works. We are extending our
methods to all of them and opening them to everyone, so that every lab
making an mRNA medicine, large or small, can reach the best design there
is.

## Reading RNA, One Molecule at a Time

{% picture figure-side images/research/nanopore-sm-features.jpg alt="" class="qb-fig-right qb-fig-right-400" %}

Every gene gives rise to many mRNA molecules, and no two need be alike.
Each may be spliced differently, carry modified bases, end in a poly(A)
tail of its own length, travel to a different part of the cell and be
bound by a different set of proteins. Together these features decide how
long a molecule lives and how much protein it makes. Most sequencing
methods, though, read short fragments averaged over millions of
molecules, so they cannot tell whether two features sit on the same
molecule.

<iframe id="ytplayer" title="How Oxford Nanopore sequencing works" width="480" height="270"
  src="https://www.youtube.com/embed/VxGliKyYuFQ?mute=1&cc_load_policy=0&controls=0&disablekb=1&loop=1&modestbranding=1&start=11"
  frameborder="0" class="qb-fig-right qb-fig-right-480"
  ></iframe>

Nanopore direct RNA sequencing reads each molecule whole. As an RNA strand
threads through a pore a few nanometers wide, every base that passes
changes the current through the pore. The signal spells out the sequence,
and modified bases and the poly(A) tail leave their own marks in it. The
RNA is read as it is, without first being copied into DNA.

{% picture figure-side images/research/nanopore-polya.jpg alt="" class="qb-fig-right qb-fig-right-420" %}

**Proteins on RNA.** Our main focus is the proteins bound to each RNA. We
develop biochemical methods that mark where a protein sat on a molecule,
so a single read shows every footprint on that RNA, and machine learning
tools that find those marks in the raw signal. Over millions of molecules,
the footprints add up to a transcriptome-wide landscape of how proteins
assemble on RNA and which ones bind together.

**A molecule's history.** The same molecules also tell us roughly when
each was made, how busily it was translated and how long its tail was.
With all of this we can follow how cells tune individual messages over
time.
